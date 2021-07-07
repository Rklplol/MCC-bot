const tmi = require('tmi.js');
const fs = require('fs');
const fetch = require('node-fetch');

const CHAT_CHANNEL = ['Rklplol'];
var commandAvailable = true;
var recordsAvailable = true;
var creditAvailable = true;
var statsAvailable = true;
var cutieAvailable = true;
var leaderboardAvailable = true;
var helpAvailable = true;
var cnrAvailable = true;
var listening = true;

var { username, password, auth, client_id } = require("./credentials");
var client;
var leaderboard;
ConnectToTwitch(CHAT_CHANNEL);

var {addedControllers} = require("./config");
const {BOT_CONTROLLER} = require("./config");

async function onMessageHandler(target, context, msg, self)
{
	if (self) { return; } 

	const commandName = msg.trim();
	var t = target.substring(1, target.length);

	if (commandName.startsWith('!start')&&(hasElevatedPermissions(context['username'])||(t == context['username']))) 
	{
		if (!listening)
		{
			outString = 'Bot has started';
			client.action(target, outString);
			listening = true;
		}
		else 
		{
			outString = 'Bot is already running';
			client.action(target, outString);
		}
	}

	if(listening)
	{	
		FetchLeaderboard();

		if (commandName.startsWith('!currentnextrank')&&(hasElevatedPermissions(context['username'])||(target.substring(1, target.length) == context['username'])))
		{
			if(cnrAvailable)
			{
			var ans = commandName.substring(16).trim()
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				var t,m; 
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);

				var outString = '';
				if (u.success&&u.data.user.league.next_at>0&&u.data.user.league.next_rank)
				{
					var r=t=u.data.user.league.rating,d=u.data.user.league.standing-u.data.user.league.next_at;
					if(d<=1000)
					{
						do
						{
							inString='https://ch.tetr.io/api/users/lists/league?before=';
							inString=inString+r+'&limit=';
							if (d>=100) inString=inString+'100';
							else inString=inString+d;
							await(fetch(inString))
								.then(m => m.json())
				    			.then(json => m = json);
							r=m.data.users[0].league.rating;
							d-=100;
						}
						while (d>0);
						t=r-t;
						outString = ans + (' needs ') + Math.round(t) + ' points to reach ' + u.data.user.league.next_rank.toUpperCase();
					}
					else outString = 'Keep it going, '+ans+', you\'re getting there!';
				}
				else
				{
					outString = ans + ' is either X or unranked';
				}
				client.action(target, outString);
				cnrAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { cnrAvailable = true; }, 30000);
			}
		}

		if (commandName.startsWith('!nextrank'))
		{
			if(commandAvailable)
			{
			var ans = commandName.substring(9).trim()
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				var t,m; 
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);

				var outString = '';
				if (u.success&&u.data.user.league.next_at>0&&u.data.user.league.next_rank)
				{
					var r=u.data.user.league.rating;
					var t = leaderboard.data.users[u.data.user.league.next_at].league.rating; 
					t=t-r;
					outString = ans + (' needs ') + Math.round(t) + ' points to reach ' + u.data.user.league.next_rank.toUpperCase();
				}
				else if (!u.success)
				{
					outString = ans + ' doesn\'t have a Tetrio profile';
				}
				else if (u.data.user.league.rank == 'x')
				{
					outString = ans + ' is already X';
				}
				else
				{
					outString = ans + ' is unranked';
				}
				client.action(target, outString);
				commandAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { commandAvailable = true; }, 5000);
			}
		}

		else if (commandName.startsWith('!credits'))
		{
			if(creditAvailable)
			{
				outString = 'Huge shoutout to Manabender (twitch.tv/Manabender), who basically made the bot available to everyone (I\'m just adding commands)';
				client.action(target, outString);
				creditAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { creditAvailable = true; }, 300000);
			}
		}

		else if (commandName.startsWith('!stats'))
		{
			if(statsAvailable)
			{
			var ans = commandName.substring(6).trim()
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);
				
				var outString = '';
				if (u.success == true&&u.data.user.league.rating>0)
				{
					outString = ans+(' is ') + (u.data.user.league.rank).toUpperCase()+' rank with '+Math.round(u.data.user.league.rating)+' TR, '+(u.data.user.league.apm)+" APM, "+(u.data.user.league.pps)+" PPS and "+(u.data.user.league.vs)+" VS";
				}
				else
				{
					outString = ans + ' has no TL stats';
				}
				client.action(target, outString);
				statsAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { statsAvailable = true; }, 5000);
			}
		}

		else if (commandName.startsWith('!records'))
		{
			if(recordsAvailable)
			{
			var ans = commandName.substring(8).trim()
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans + '/records';
				console.log(inString);
				var u = null;
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);
				
				var outString = '';
				if (u.success == true)
				{
					//var sprint = Object.keys(u.data.records);
					if (u.data.records['40l'].record)
					{
						var time = Math.round(u.data.records['40l'].record.endcontext.finalTime)/1000;
						var minutes = Math.floor(time/60);
						
						outString += 'Sprint time: ';
						if (minutes>0)
						{
							time -= minutes*60;
							outString += minutes;
							outString += ':';
							outString += time;
						}
						else outString += time;
						if (u.data.records['40l'].rank)
						{
							outString += ', global rank: ';
							outString += u.data.records['40l'].rank;
						}
						outString += ', replay link: tetr.io/#r:';
						outString += u.data.records['40l'].record.replayid;
					}
					else
					{
						outString += 'Never played sprint, ';
					}

					if (u.data.records.blitz.record)
					{
						outString += ' Blitz score: ';
						outString += u.data.records.blitz.record.endcontext.score;
						if (u.data.records.blitz.rank)
						{
							outString += ' global rank: ';
							outString += u.data.records.blitz.rank;
						}
						outString += ', replay link: tetr.io/#r:';
						outString += u.data.records.blitz.record.replayid;
					}
					else
					{
						outString += ' never played blitz';
					}
				}
				else 
				{
					outString = ans + ' doesn\'t have a Tetrio profile';
				}

				client.action(target, outString);
				recordsAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { recordsAvailable = true; }, 10000);
			}
		}

		else if (commandName.startsWith('!randomstream')&&(hasElevatedPermissions(context['username'])||(target.substring(1, target.length) == context['username'])))
		{
				const options = {
  				headers: 
  					{
   					 "Authorization": "Bearer "+auth,
   					 "Client-Id": client_id
  					}
				};
				var inString = 'https://api.twitch.tv/helix/search/channels?query=TETR.IO';
				console.log(inString);
				var u = null;
				var count = 0;
				await(fetch(inString, options))
				.then(u => u.json())
			    .then(json => u = json);
				//console.log(u);
				do
				{
					var r = Math.floor(Math.random()*u.data.length);
					count++;
				} while (u.data[r].is_live == false && count < 10);
				var outString = '';
				if(count < 10)
				{
					outString = 'Random Tetris (probably) stream: ';
					outString += u.data[r].display_name;
					outString += ' plays ';
					outString += u.data[r].game_name;
					outString += ' at twitch.tv/';
					outString += u.data[r].broadcaster_login;
				}
				else
				{
					outString = 'Command was unable to find relevant channels';
				}
				client.action(target, outString);
		}

		else if (commandName.startsWith('!commands'))
		{
			if(helpAvailable)
			{
				outString = 'stats <name>, nextrank <name>, records <name>, credits';
				client.action(target, outString);
				helpAvailable[i] = false;
				leadersTimeoutFunc = setTimeout(function () { helpAvailable = true; }, 30000);
			}

		}

		else if (commandName.startsWith('!stop')&&(hasElevatedPermissions(context['username'])||(target.substring(1, target.length) == context['username'])))
		{
			outString = 'Bot shuts down, type !start to start it again';
			client.action(target, outString);
			listening = false;
		}
	}
}

function isBotController(user)
{
	if (user == BOT_CONTROLLER.toLowerCase())
	{
		return true;
	}
	return false;
}

function hasElevatedPermissions(user)
{
	if (user == BOT_CONTROLLER.toLowerCase())
	{
		return true;
	}
	if (addedControllers.includes(user))
	{
		return true;
	}
	return false;
}

function onConnectedHandler(addr, port)
{
	console.log('* Connected successfully to Twitch channel.');
}

function ConnectToTwitch(channels)
{
	channels.forEach (channel => {
		var opts = {
			identity: {
				username: username,
				password: password
			},
			channels: [
				channel
			]
		};

		client = new tmi.client(opts);

		client.on('message', onMessageHandler);
		client.on('connected', onConnectedHandler);
		FetchLeaderboard();

		client.connect();
		setTimeout(function () {}, 1000)
	})
}

async function FetchLeaderboard()
{
	if (leaderboardAvailable)
	{
		leaderboardAvailable = false;
		console.log("Fetching leaderboard");
		var inString = 'https://ch.tetr.io/api/users/lists/league/all';
		await(fetch(inString))
				.then(leaderboard => leaderboard.json())
			    .then(json => leaderboard = json);
		console.log("Fetching done");
		leadersTimeoutFunc = setTimeout(function () { leaderboardAvailable = true; }, 3600000);
	}
}