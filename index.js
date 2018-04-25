const Command = require('command');

const VIAL_ID = 182433;							// Vial of Elinu's Tears ID
const ACTION_DELAY = 1000;						// Delay between different actions in milliseconds
const CHAR_SELECT_DELAY = 10000;				// Delay between retrieving the character list and selecting the character in milliseconds

module.exports = function autoVials(dispatch) {
	
	const command = new Command(dispatch);
	
	let enabled = false,
		cooldown = false,
		gameId = null,
		playerId = null,
		itemId = null,
		itemAmount = null,
		chars = null,
		charsUsed = [],
		returnToChar = null,
		cdTimer = null,
		charSelectTimer = null
		
		
	dispatch.hook('S_LOGIN', 10, (event) => {
		({gameId, playerId} = event);
	});
	
	dispatch.hook('S_INVEN', 12, (event) => {
		let invenList = event.items;
		
		for(i = 0; i < invenList.length; i++) {
			if(invenList[i].id == VIAL_ID) {
				itemId = invenList[i].dbid;
				itemAmount = invenList[i].amount;
				break;
			}
		}
	});
	
	dispatch.hook('S_START_COOLTIME_ITEM', 1, (event) => {
		if(event.item == VIAL_ID) {
			cooldown = true;
			cdTimer = setTimeout(function() { cooldown = false }, event.cooldown * 1000);
		}
	});
	
	dispatch.hook('S_RETURN_TO_LOBBY', 'raw', () => {
		cooldown = false;
		itemId = null;
		itemAmount = null;
		clearTimeout(cdTimer);
	});
	
	dispatch.hook('C_SELECT_USER', 'raw', () => {
		if(enabled || returnToChar) {
			return false;
		}
	});
	
	dispatch.hook('C_CANCEL_RETURN_TO_LOBBY', 'raw', () => {
		if(!enabled && returnToChar) {
			returnToChar = null;
			command.message('[Auto Vials] Interrupted return to the starting character.');
		}
	});
	
	dispatch.hook('C_LOAD_TOPO_FIN', 'raw', () => {
		if(enabled) {
			setTimeout(useVial, ACTION_DELAY);
		}
	});
	
	dispatch.hook('S_GET_USER_LIST', 14, (event) => {
		if(!charSelectTimer) {
			chars = event.characters;
			
			if(enabled) {
				for(i = 0; i < chars.length; i++) {
					if(charsUsed.indexOf(chars[i].id) == -1) {
						let charid = chars[i].id;
						
						charSelectTimer = setTimeout(function() {
							dispatch.toServer('C_SELECT_USER', 1, {
								id: charid,
								unk: 0
							});
							charSelectTimer = null;
						}, CHAR_SELECT_DELAY);
						
						console.log(`[Auto Vials] Next character selected: ${chars[i].name}`);
						break;
					}
				}
			} else if(returnToChar) {
				charSelectTimer = setTimeout(function() {
					dispatch.toServer('C_SELECT_USER', 1, {
						id: returnToChar,
						unk: 0
					});
					charSelectTimer = null;
					returnToChar = null;
				}, CHAR_SELECT_DELAY);
				console.log(`[Auto Vials] Returning to the starting character...`);
			}
		}
	});
	
	command.add('autovials', () => {
		if(!enabled) {
			enabled = true;
			returnToChar = playerId;
			command.message('[Auto Vials] Auto Vials enabled.');
			console.log(`[Auto Vials] Auto Vials enabled.`);
			useVial();
		} else {
			disableAutoVial();
			returnToChar = null;
		}
	});
	
	function useVial() {
		if(!cooldown && itemAmount > 0) {
			dispatch.toServer('C_USE_ITEM', 2, {
				ownerId: gameId,
				id: VIAL_ID,
				uniqueId: itemId,
				targetId: 0,
				amount: 1,
				targetX: 0,
				targetY: 0,
				targetZ: 0,
				x: 0,
				y: 0,
				z: 0,
				w: 0,
				unk1: 0,
				unk2: 0,
				unk3: 0,
				unk4: 0
			});
			command.message('[Auto Vials] Vial of Elinu\'s Tears used.');
		}
		charsUsed.push(playerId);
		
		if(chars.length > charsUsed.length) {
			command.message('[Auto Vials] Switching characters...');
			setTimeout(returnToLobby, ACTION_DELAY);
		} else {
			disableAutoVial();
			setTimeout(returnToLobby, ACTION_DELAY);
			command.message('[Auto Vials] Returning to the starting character...');
		}
	}
	
	function returnToLobby() {
		dispatch.toServer('C_RETURN_TO_LOBBY', 1);
	}
	
	function disableAutoVial() {
		enabled = false;
		charsUsed = [];
		command.message('[Auto Vials] Auto Vials disabled.');
		console.log(`[Auto Vials] Auto Vials disabled.`);
	}
}