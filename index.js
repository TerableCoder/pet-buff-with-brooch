String.prototype.clr = function (hexColor){ return `<font color='#${hexColor}'>${this}</font>` };

module.exports = function PetBuffWithBrooch(mod){
	let petInfo = null;
	let timeout = null;

	mod.hook('C_USE_ITEM', 3, (event) => {
		if(!mod.settings.enabled) return;

		if(mod.settings.broochIDs.includes(event.id)){
			if(petInfo && petInfo.power){
				let powerId = 1098 + petInfo.power;
				mod.send('C_START_SERVANT_ACTIVE_SKILL', 1, {
					gameId: petInfo.gameId,
					id: powerId
				});
			} else{
				mod.command.message("Pet is missing. Cannot use [Bracing Force].".clr("FF5555"));
			}
		}
	});

	/*id
	marie 	1001 	1002 	1003
	loo 	1004 	1005 	1006
	kuncun 	1007 	1008 	1009
	cocomin	1000/1010 1011 	1012*/
	mod.hook('S_REQUEST_SPAWN_SERVANT', 3, (event) => {
		if(mod.game.me.is(event.ownerId)){
			petInfo = event;
			let power = 0;
			if([1001, 1004, 1007, 1000, 1010].includes(event.id)){ // green servant
				power = calculatePower(3, event.fellowship);
			} else if([1002, 1005, 1008, 1011].includes(event.id)){ // blue servant
				power = calculatePower(4, event.fellowship);
			} else if([1003, 1006, 1009, 1012].includes(event.id)){ // yellow servant
				power = calculatePower(5, event.fellowship);
			}
			petInfo.power = power;
		}
	});

	mod.hook('S_REQUEST_DESPAWN_SERVANT', 1, (event) => {
		if(petInfo && petInfo.gameId == event.gameId){
			petInfo = null;
		}
	});
	
	mod.hook('S_START_COOLTIME_SERVANT_SKILL', 1, (event) => {
		if(!mod.settings.enabled || !mod.settings.recast) return;
		clearTimeout(timeout);
		timeout = mod.setTimeout(() => {
			if(petInfo && petInfo.power){
				let powerId = 1098 + petInfo.power;
				if(mod.game.me.alive && mod.game.me.inCombat){
					mod.send('C_START_SERVANT_ACTIVE_SKILL', 1, {
						gameId: petInfo.gameId,
						id: powerId
					});
				} else{
					if(!mod.game.me.alive) mod.command.message("Manually use your pet upon reviving".clr("FF0000"));
				}
			} else{
				mod.command.message("Pet is missing. Cannot use [Bracing Force].".clr("FF5555"));
			}
		}, 180010);
	});
	
	function calculatePower(grade, fellowship){ // https://docs.google.com/spreadsheets/d/1vVjt-XMAsKaPDSNjWlRMNCXUQHlWUHp-QKnJb_NhIdw/edit#gid=0
		if(fellowship < 25){ // 1-24 fellowship
			return (grade + Math.floor((fellowship-1) / 3));
		} else if(fellowship < 45){ // 25-44 fellowship
			return (grade + Math.floor((fellowship-1) / 2)-4);
		} else if(fellowship < 51){ // 45-50 fellowship
			return (grade + (fellowship-25)+(2*(fellowship-45)));
		}
	}

	mod.command.add(['petbuff'], (arg) => {
		if(arg) arg = arg.toLowerCase();
		if(arg == undefined){
			mod.settings.enabled = !mod.settings.enabled;
		} else if(['enable', 'on'].includes(arg)){
			mod.settings.enabled = true;
		} else if(['disable', 'off'].includes(arg)){
			mod.settings.enabled = false;
		} else if(['recast'].includes(arg)){
			mod.settings.recast = !mod.settings.recast;
			mod.command.message(`recast ${mod.settings.recast ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00')}.`);
		}
		mod.command.message(mod.settings.enabled ? 'Enabled'.clr('56B4E9') : 'Disabled'.clr('E69F00'));
	});
}