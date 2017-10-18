const Command = require('command');
const { protocol } = require('tera-data-parser');

const VIAL_ID = 182433;							// Vial of Elinu's Tears ID
const ACTION_DELAY = 1000;						// Delay between different actions in milliseconds
const CHAR_SELECT_DELAY = 10000;				// Delay between retrieving the character list and selecting the character in milliseconds

if(!protocol.messages.has('C_CANCEL_RETURN_TO_LOBBY')) {
	protocol.messages.set('C_CANCEL_RETURN_TO_LOBBY', new Map().set(1, []));
}

module.exports = function autoVials(dispatch) {
	
	const command = new Command(dispatch);
	
	let enabled = false,
		cooldown = false,
		cid = null,
		playerId = null,
		itemId = null,
		itemAmount = null,
		chars = null,
		charsUsed = [],
		returnToChar = null,
		cdTimer = null,
		charSelectTimer = null
		
		
	dispatch.hook('S_LOGIN', 4, (event) => {
		({cid} = event);
		({playerId} = event);
	});
	
	dispatch.hook('S_INVEN', 9, (event) => {
		let invenList = event.items;
		
		for(i = 0; i < invenList.length; i++) {
			if(invenList[i].dbid == VIAL_ID) {
				itemId = invenList[i].id.low;
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
	
	dispatch.hook('S_RETURN_TO_LOBBY', 1, () => {
		cooldown = false;
		itemId = null;
		itemAmount = null;
		clearTimeout(cdTimer);
	});
	
	dispatch.hook('C_SELECT_USER', 1, () => {
		if(enabled || returnToChar) {
			return false;
		}
	});
	
	dispatch.hook('C_CANCEL_RETURN_TO_LOBBY', 1, () => {
		if(!enabled && returnToChar) {
			returnToChar = null;
			command.message('Interrupted return to the starting character.');
		}
	});
	
	dispatch.hook('C_LOAD_TOPO_FIN', 1, () => {
		if(enabled) {
			setTimeout(useVial, ACTION_DELAY);
		}
	});
	
	dispatch.hook('S_GET_USER_LIST', 5, (event) => {
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
						
						console.log(`[Auto Vials] Next character selected: ${chars[i].name} (ID: ${chars[i].id})`);
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
			command.message('Auto Vials enabled.');
			console.log(`[Auto Vials] Auto Vials enabled.`);
			useVial();
		} else {
			disableAutoVial();
			returnToChar = null;
		}
	});
	
	function useVial() {
		if(!cooldown && itemAmount > 0) {
			dispatch.toServer('C_USE_ITEM', 1, {
				ownerId: cid,
				item: VIAL_ID,
				id: itemId,
				unk1: 0,
				unk2: 0,
				unk3: 0,
				unk4: 1,
				unk5: 0,
				unk6: 0,
				unk7: 0,
				x: 0,
				y: 0,
				z: 0,
				w: 0,
				unk8: 0,
				unk9: 0,
				unk10: 0,
				unk11: 0
			});
			command.message('Vial of Elinu\'s Tears used.');
		}
		charsUsed.push(playerId);
		
		if(chars.length > charsUsed.length) {
			command.message('Switching characters...');
			setTimeout(returnToLobby, ACTION_DELAY);
		} else {
			disableAutoVial();
			setTimeout(returnToLobby, ACTION_DELAY);
			command.message('Returning to the starting character...');
		}
	}
	
	function returnToLobby() {
		dispatch.toServer('C_RETURN_TO_LOBBY', 1);
	}
	
	function disableAutoVial() {
		enabled = false;
		charsUsed = [];
		command.message('Auto Vials disabled.');
		console.log(`[Auto Vials] Auto Vials disabled.`);
	}
}