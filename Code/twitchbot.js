const tmi = require('tmi.js');
const fs = require('fs');
const fetch = require('node-fetch');
const CHAT_CHANNEL = [];
addedControllers = JSON.parse(fs.readFileSync('Code/users.txt'));
	CHAT_CHANNEL.push(addedControllers[0].name)
var commandAvailable = true;
var recordsAvailable = true;
var creditAvailable = true;
var statsAvailable = true;
var leaderboardAvailable = true;
var requirementAvailable = true;
var helpAvailable = true;
var cnrAvailable = true;
var listening = true;
var ranks = ['d','d+','c-','c','c+','b-','b','b+','a-','a','a+','s-','s','s+','ss','u','x'];
var percentiles = [1,0.975,0.95,0.9,0.84,0.78,0.7,0.62,0.54,0.46,0.38,0.3,0.23,0.17,0.11,0.05,0.01]
var requirements = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

var { username, password, auth, client_id } = require("./credentials");
var client;
var leaderboard;
ConnectToTwitch(CHAT_CHANNEL);

const BOT_CONTROLLER = 'Rklplol';
var addedControllers;

async function onMessageHandler(target, context, msg, self)
{
	if (self) { return; } 

	const commandName = msg.trim();
	var t = target.substring(1, target.length);
	if((!CHAT_CHANNEL.includes(t.toLowerCase()))||(!commandName.startsWith('!'))||isBanned(t, context['username'])) return;

	if (commandName.startsWith('!start')&&(hasElevatedPermissions(t, context['username'])||(t == context['username']))) 
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

		if (commandName.startsWith('!bot')||commandName.startsWith('!info')||commandName.startsWith('!botinfo')) 
		{
			outString = botNames[i];
			outString += ' has started';
			client.action(target, outString);
		}

		else if (commandName.startsWith('!currentnextrank')&&(hasElevatedPermissions(t, context['username'])||(t == context['username'])))
		{
			if(cnrAvailable)
			{
			var ans = commandName.substring(16).trim();
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_-\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				var t,m; 
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);

				var outString = '';

				if (!u.success)
				{
					outString = ans + ' doesn\'t have a Tetrio profile';
				}
				else 
				{
					if(u.data.user.league.rating > 0)
					{
						var r = u.data.user.league.rating;
						if (u.data.user.league.rank == 'x')
						{
							outString = ans + ' is already X';
						}
						else
						{
							if (u.data.user.league.next_at>0)
							{ 
								var t=u.data.user.league.rating,d=u.data.user.league.standing-u.data.user.league.next_at;
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

								if (r>=requirements[16])
								{
									outString = ans + (', why do you smurf? (this player is X, but unranked)');
								}
								else
								for (var i = 0; i < ranks.length-1; i++) 
								{
									if (r>=requirements[i]&&r<requirements[i+1])
									{
										outString = ans + (' needs ') + Math.round(requirements[i+1]-r) + ' points to reach ' + ranks[i+1].toUpperCase();
									}
								}
							}
						}
					}
					else
					{
						if (u.data.user.role == 'anon')
							outString = ans + (' is an anonymous account');
						else if (u.data.user.role == 'banned')
							outString = ans + (' is restricted');
						else
							outString = ans + (' didn\'t play 10 placement matches');
					}
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
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_-\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				var t,m; 
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);
				var outString = '';
				if (!u.success)
				{
					outString = ans + ' doesn\'t have a Tetrio profile';
				}
				else 
				{
					if(u.data.user.league.rating > 0)
					{
						var r = u.data.user.league.rating;
						if (u.data.user.league.rank == 'x')
						{
							outString = ans + ' is already X';
						}
						else
						{
							if (u.data.user.league.next_at>0)
							{ 
								var t = leaderboard.data.users[u.data.user.league.next_at].league.rating;
								outString = ans + (' needs ') + Math.round(t-r) + ' points to reach ' + u.data.user.league.next_rank.toUpperCase();
							}
							else
							{

								if (r>=requirements[16])
								{
									outString = ans + (', why do you smurf? (this player is X, but unranked)');
								}
								else
								for (var i = 0; i < ranks.length-1; i++) 
								{
									if (r>=requirements[i]&&r<requirements[i+1])
									{
										outString = ans + (' needs ') + Math.round(requirements[i+1]-r) + ' points to reach ' + ranks[i+1].toUpperCase();
									}
								}
							}
						}
					}
					else
					{
						if (u.data.user.role == 'anon')
							outString = ans + (' is an anonymous account');
						else if (u.data.user.role == 'banned')
							outString = ans + (' is restricted');
						else
							outString = ans + (' didn\'t play 10 placement matches');
					}
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
				outString = 'Made by Rklplol twitch.tv/Rklplol, using some code from Manabender twitch.tv/Manabender and Andrea twitch.tv/andre_it_is. If you\'re from Tetris community, no matter who you are... I love you!';
				client.action(target, outString);
				creditAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { creditAvailable = true; }, 100000);
			}
		}

		else if (commandName.startsWith('!stats'))
		{
			if(statsAvailable)
			{
			var ans = commandName.substring(6).trim()
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_-\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans;
				console.log(inString);
				var u = null;
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);
				
			    var outString = '';
			    if (!u.success)
				{
					outString = ans + ' doesn\'t have a Tetrio profile';
				}
				else 
				{
					if(u.data.user.league.rating > 0)
					{
						outString = ans+(' is ') + (u.data.user.league.rank).toUpperCase()+' rank with '+Math.round(u.data.user.league.rating)+' TR, '+(u.data.user.league.apm)+" APM, "+(u.data.user.league.pps)+" PPS and "+(u.data.user.league.vs)+" VS";
					}
					else
					{
						if(u.data.user.league.gamesplayed > 0)
						{
							outString = ans + (' played ') + u.data.user.league.gamesplayed + " Tetra League matches, and has " + (u.data.user.league.apm)+" APM, "+(u.data.user.league.pps)+" PPS and "+(u.data.user.league.vs)+" VS";	
						}
						else 
						{
							if (u.data.user.role == 'anon')
								outString = ans + (' is an anonymous account');
							else if (u.data.user.role == 'banned')
								outString = ans + (' is restricted');
							else 
								outString = ans + (' didn\'t play a single Tetra League match. Shame on you!');
						}
					}
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
			ans = (ans.toLowerCase()).replace(/[^0-9a-z_-\s]/g, "");
				var inString = 'https://ch.tetr.io/api/users/' + ans + '/records';
				console.log(inString);
				var u = null;
				await(fetch(inString))
				.then(u => u.json())
			    .then(json => u = json);
				
				var outString = '';
				if (u.success == true)
				{
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

		else if (commandName.startsWith('!randomstream')&&(hasElevatedPermissions(t, context['username'])||(t == context['username'])))
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
				outString = ' Owner:\n!addmod <name>\n!removemod <name>\n!setbotname\nMod:\n!start\n!stop\n!currentnextrank <name> 30s\nUser: \n!stats <name> 5s\n!nextrank <name> 5s\n!records <name> 10s\n!credits 100s\n!requirements <blank, all or certain rank> 30s';
				client.action(target, outString);
				helpAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { helpAvailable = true; }, 30000);
			}
		}

		else if (commandName.startsWith('!refresh')&&(isBotController(context['username'])))
		{
			FetchLeaderboard();
		}

		else if (commandName.startsWith('!requirements'))
		{
			if(requirementAvailable)
			{
				var ans = commandName.substring(13).trim();
				ans = (ans.toLowerCase());

				var outString = '';
				if(ans == 'all' || ans == '')
				{
					for (var t=0;t<17;t++){
						outString += ranks[t];
						outString += ': ';
						outString += requirements[t];
						outString += ' ';
					}
				}
				else
				{
					var found = false;
					for(var t = 0; t < ranks.length; t++)
					{
						if(ranks[t] == ans)
						{
							outString += ranks[t];
							outString += ': ';
							outString += requirements[t];
							outString += ' ';
							found = true;
							break;
						}
					}
					if (!found)
					{
						outString += 'No such rank';
					}

				}
				client.action(target, outString);
				requirementAvailable = false;
				leadersTimeoutFunc = setTimeout(function () { requirementAvailable = true; }, 30000);
			}

		}

		else if (commandName.startsWith('!stop')&&(hasElevatedPermissions(t, context['username'])||(t == context['username'])))
		{
			outString = 'Bot shuts down, type !start to start it again';
			client.action(target, outString);
			listening = false;
		}

		else if (commandName.startsWith('!addmod')&&(isBotController(context['username'])||(t == context['username'])))
		{
			var dupe = false;
			var ans = commandName.substring(7).trim();
				ans = (ans.toLowerCase());	
			for (var i = 0; i < addedControllers.length; i++)
			{
				if (addedControllers[i].name.toLowerCase()==t)
				{
					for (var j = 0; j < addedControllers[i].moderators.length; j++)
						if(addedControllers[i].moderators[j].toLowerCase() == ans)
							dupe = true;
					if(!dupe)
					{
						addedControllers[i].moderators.push(ans);
						fs.writeFile('Code/users.txt', JSON.stringify(addedControllers), (err) =>
						{
						    if (err) throw err;
						});
					}	
				}
			}
			if(dupe)
			{
				console.log("Duplicating "+ans+" to "+t+"\'s bot moderators blocked");
				outString = ans;
				outString += ' is already a bot moderator!';
				client.action(target, outString);
			}
			else 
			{
				console.log("Adding "+ans+" to "+t+"\'s bot moderators");
				outString = 'Promoting ';
				outString += ans;
				outString += ' to a bot moderator, be careful';
				client.action(target, outString);
			}
			
		}

		else if (commandName.startsWith('!removemod')&&(isBotController(context['username'])||(t == context['username'])))
		{
			var found = false;
			var ans = commandName.substring(10).trim();
				ans = (ans.toLowerCase());
			for (var i = 0; i < addedControllers.length; i++)
			{
				if (addedControllers[i].name.toLowerCase()==t)
					for (var j = 0; j < addedControllers[i].moderators.length; j++)
						if(addedControllers[i].moderators[j].toLowerCase() == ans)
						{
							addedControllers[i].moderators.splice(j,1);
							fs.writeFile('Code/users.txt', JSON.stringify(addedControllers), (err) =>
							{
							    if (err) throw err;
							});
							found = true;
							break;
						}
			}
			if(found)
			{
				console.log("Removing "+ans+" from "+t+"\'s bot moderators");
				outString = 'Removing ';
				outString += ans;
				outString += ' as a bot moderator';
				client.action(target, outString);
			}
			else
			{
				console.log("Can't remove "+ans+" from "+t+"\'s bot moderators");
				outString = 'Can\'t remove ';
				outString += ans;
				client.action(target, outString);
			}
		}

		else if (commandName.startsWith('!ban')&&(isBotController(context['username'])||hasElevatedPermissions(t, context['username'])||(t == context['username'])))
		{
			var dupe = false;
			var ans = commandName.substring(4).trim();
				ans = (ans.toLowerCase());	
			var outString = '';

			if (ans == t||ans == BOT_CONTROLLER.toLowerCase()) {
				outString = 'Uhh, I don\'t think I can do this, even for you, ';
				outString += context['username'];
				client.action(target, outString);
				return;
			}
			for (var j = 0; j < addedControllers[0].moderators.length; j++)
				if(addedControllers[0].moderators[j].toLowerCase() == ans)
				{
					outString = ans;
					outString += ' is a bot moderator';
					client.action(target, outString);
					return;
				}
			for (var j = 0; j < addedControllers[0].banlist.length; j++)
				if(addedControllers[0].banlist[j].toLowerCase() == ans)
					dupe = true;
			if(!dupe)
			{
				addedControllers[0].banlist.push(ans);
				fs.writeFile('Code/users.txt', JSON.stringify(addedControllers), (err) =>
				{
				    if (err) throw err;
				});
			}	
			if (dupe)
			{
				console.log("Duplicating "+ans+" to "+t+"\'s ban blocked");
				outString = ans;
				outString += ' is already banned!';
				client.action(target, outString);
			}
			else 
			{
				console.log(ans+" is banned from "+t+"\'s channel");
				outString = ans;
				outString += ' is banned from using the bot here!';
				client.action(target, outString);
			}
		}

		else if (commandName.startsWith('!unban')&&(isBotController(context['username'])||hasElevatedPermissions(t, context['username'])||(t == context['username'])))
		{
			var found = false;
			var ans = commandName.substring(6).trim();
				ans = (ans.toLowerCase());
			for (var i = 0; i < addedControllers.length; i++)
			{
				if (addedControllers[i].name.toLowerCase()==t)
					for (var j = 0; j < addedControllers[i].banlist.length; j++)
						if(addedControllers[i].banlist[j].toLowerCase() == ans)
						{
							addedControllers[i].banlist.splice(j,1);
							fs.writeFile('Code/users.txt', JSON.stringify(addedControllers), (err) =>
							{
							    if (err) throw err;
							});
							found = true;
							break;
						}
			}
			if(found)
			{
				console.log("Removing "+ans+" from "+t+"\'s banlist");
				outString = 'Removing ';
				outString += ans;
				outString += ' from ban list';
				client.action(target, outString);
			}
			else
			{
				console.log("Can't unban "+ans+" from "+t+"\'s channel");
				outString = 'Can\'t unban ';
				outString += ans;
				client.action(target, outString);
			}
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

function hasElevatedPermissions(target, user)
{
	if (user == BOT_CONTROLLER.toLowerCase())
	{
		return true;
	}
	for (var u = 0; u < addedControllers.length; u++)
	if (addedControllers[u].name.toLowerCase() == target&&addedControllers[u].moderators.includes(user.toLowerCase()))
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
		console.log("Finding rank requirements");
		var currentPlace = leaderboard.data.users.length - 1;
		for (var i = 0; i < ranks.length; i++) {
			requirements[i] = Math.round(leaderboard.data.users[Math.round(currentPlace*percentiles[i])].league.rating);
		}
		console.log("Rank requirements operation completed");
		leadersTimeoutFunc = setTimeout(function () { leaderboardAvailable = true; }, 3600000);
	}
}

function isBanned(t, channel)
{
	for (var j = 0; j < addedControllers[0].banlist.length; j++)
		if(addedControllers[0].banlist[j].toLowerCase() == channel)
			return true;
	return false;
}