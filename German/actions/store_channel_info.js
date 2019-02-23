module.exports = {

//---------------------------------------------------------------------
// Action Name
//
// This is the name of the action displayed in the editor.
//---------------------------------------------------------------------

name: "Kanal Info speichern",

//---------------------------------------------------------------------
// Action Section
//
// This is the section the action will fall into.
//---------------------------------------------------------------------

section: "Kanal Verwaltung",

//---------------------------------------------------------------------
// Action Subtitle
//
// This function generates the subtitle displayed next to the name.
//---------------------------------------------------------------------

subtitle: function(data) {
	const channels = ['Gleicher Kanal', 'Befehls Author', 'Erwähnter Nutzer', 'Erwähnter Kanal', 'Standard Kanal', 'Temporäre Variabel', 'Serverweite Variabel', 'Globale Variabel'];
	const info = ['Kanal Objekt', 'Kanal ID', 'Kanal Name', 'Kanal Thema', 'Letzte Kanal Nachricht', 'Kanal Position', 'NSFW Kanal?', 'DM Kanal?']; //Fixed UI by ZockerNico
	return `${channels[parseInt(data.channel)]} - ${info[parseInt(data.info)]}`;
},

//---------------------------------------------------------------------
// Action Storage Function
//
// Stores the relevant variable info for the editor.
//---------------------------------------------------------------------

variableStorage: function(data, varType) {
	const type = parseInt(data.storage);
	if(type !== varType) return;
	const info = parseInt(data.info);
	let dataType = 'Unbekannte Art';
	switch(info) {
		case 0:
			dataType = "Kanal";
			break;
		case 1:
			dataType = "Kanal ID";
			break;
		case 2:
		case 3:
			dataType = "Text";
			break;
		case 4:
			dataType = "Nachricht";
			break;
		case 5:
			dataType = "Nummer";
			break;
		case 6:
		case 7: //Fixed UI by ZockerNico
			dataType = "Boolean";
			break;
	}
	return ([data.varName2, dataType]);
},

//---------------------------------------------------------------------
// Action Fields
//
// These are the fields for the action. These fields are customized
// by creating elements with corresponding IDs in the HTML. These
// are also the names of the fields stored in the action's JSON data.
//---------------------------------------------------------------------

fields: ["channel", "varName", "info", "storage", "varName2"],

//---------------------------------------------------------------------
// Command HTML
//
// This function returns a string containing the HTML used for
// editting actions. 
//
// The "isEvent" parameter will be true if this action is being used
// for an event. Due to their nature, events lack certain information, 
// so edit the HTML to reflect this.
//
// The "data" parameter stores constants for select elements to use. 
// Each is an array: index 0 for commands, index 1 for events.
// The names are: sendTargets, members, roles, channels, 
//                messages, servers, variables
//---------------------------------------------------------------------

html: function(isEvent, data) {
	return `
<div>
	<div style="float: left; width: 35%;">
		Ursprungs Kanal:<br>
		<select id="channel" class="round" onchange="glob.channelChange(this, 'varNameContainer')">
			${data.channels[isEvent ? 1 : 0]}
		</select>
	</div>
	<div id="varNameContainer" style="display: none; float: right; width: 60%;">
		Variabel Name:<br>
		<input id="varName" class="round" type="text" list="variableList"><br>
	</div>
</div><br><br><br>
<div>
	<div style="padding-top: 8px; width: 70%;">
		Source Info:<br>
		<select id="info" class="round">
			<option value="0" selected>Kanal Objekt</option>
			<option value="1">Kanal ID</option>
			<option value="2">Kanal Name</option>
			<option value="3">Kanal Thema</option>
			<option value="4">Letzte Kanal Nachricht</option>
			<option value="5">Kanal Position</option>
			<option value="6">NSFW Kanal?</option>
			<option value="7">DM Kanal?</option>
		</select>
	</div>
</div><br>
<div>
	<div style="float: left; width: 35%;">
		Speichern in:<br>
		<select id="storage" class="round">
			${data.variables[1]}
		</select>
	</div>
	<div id="varNameContainer2" style="float: right; width: 60%;">
		Variabel Name:<br>
		<input id="varName2" class="round" type="text"><br>
	</div>
</div>`
},

//---------------------------------------------------------------------
// Action Editor Init Code
//
// When the HTML is first applied to the action editor, this code
// is also run. This helps add modifications or setup reactionary
// functions for the DOM elements.
//---------------------------------------------------------------------

init: function() {
	const {glob, document} = this;

	glob.channelChange(document.getElementById('channel'), 'varNameContainer');
},

//---------------------------------------------------------------------
// Action Bot Function
//
// This is the function for the action within the Bot's Action class.
// Keep in mind event calls won't have access to the "msg" parameter, 
// so be sure to provide checks for variable existance.
//---------------------------------------------------------------------

action: function(cache) {
	const data = cache.actions[cache.index];
	const DiscordJS = this.getDBM().DiscordJS;
	const channel = parseInt(data.channel);
	const varName = this.evalMessage(data.varName, cache);
	const info = parseInt(data.info);
	const targetChannel = this.getChannel(channel, varName, cache);
	if(!targetChannel) {
		this.callNextAction(cache);
		return;
	}
	let result;
	switch(info) {
		case 0:
			result = targetChannel;
			break;
		case 1:
			result = targetChannel.id;
			break;
		case 2:
			result = targetChannel.name;
			break;
		case 3:
			result = targetChannel.topic;
			break;
		case 5:
			result = targetChannel.position;
			break;
		case 6:
			result = targetChannel.nsfw;
			break;
		case 7:
			result = (targetChannel instanceof DiscordJS.GroupDMChannel || targetChannel instanceof DiscordJS.DMChannel);
			break;
		default:
			break;
	}
	if(info === 4) {
		targetChannel.fetchMessage(targetChannel.lastMessageID).then(function(resultMessage) {
			const storage = parseInt(data.storage);
			const varName2 = this.evalMessage(data.varName2, cache);
			this.storeValue(resultMessage, storage, varName2, cache);
			this.callNextAction(cache);
		}.bind(this)).catch(this.displayError.bind(this, data, cache));
	} else if(result !== undefined) {
		const storage = parseInt(data.storage);
		const varName2 = this.evalMessage(data.varName2, cache);
		this.storeValue(result, storage, varName2, cache);
		this.callNextAction(cache);
	} else {
		this.callNextAction(cache);
	}
},

//---------------------------------------------------------------------
// Action Bot Mod
//
// Upon initialization of the bot, this code is run. Using the bot's
// DBM namespace, one can add/modify existing functions if necessary.
// In order to reduce conflictions between mods, be sure to alias
// functions you wish to overwrite.
//---------------------------------------------------------------------

mod: function(DBM) {
}

}; // End of module