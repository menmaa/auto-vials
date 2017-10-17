# auto-vials

A tera-proxy module. Automatically logs in to all characters and uses "Vial of Elinu's Tears" from each character's inventory.

### Prerequisites

* [command](https://github.com/pinkipi/command) - by Pinkie Pie

### Usage

`/proxy autovials` or `/8 autovials` to enable or disable the module.

To interrupt it before it's finished, you should cancel the return to character selection and run the command afterwards.

### Additional Information

* The module will login to a character whether or not it has Vial of Elinu's Tears in the inventory. If it doesn't find any, or it finds but it is on cooldown, it will simply proceed to the next character.
* The module will prevent you from selecting a character manually while it is running, for additional safety.
* When the module has finished its job, it will return to the character it was started from. To interrupt this process simply click cancel on the "Returning to character selection" message.
* You can pause the process by cancelling the return to character selection. The process will continue if you manually return to character selection later.
* It is recommended to change the values of `ACTION_DELAY` and `CHAR_SELECT_DELAY` according to your needs. The reason these exist is to avoid any potential client bugs and make the module behave closer to a human by delaying the actions a bit instead of directly executing them.
