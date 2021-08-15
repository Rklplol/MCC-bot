const tmi = require('tmi.js');
const fs = require('fs');
const fetch = require('node-fetch');
var Discord = require('discord.js');
const bot = new Discord.Client();

var { username, password, auth, client_id, discord, discordRoom, tetrio, tetriosession } = require("./credentials");
var client;
var leaderboard = JSON.parse(fs.readFileSync('Code/leaderboard.txt'));
bot.login(discord).catch(console.error);
bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
});

const CHAT_CHANNEL = [];
addedControllers = JSON.parse(fs.readFileSync('Code/users.txt'));
	CHAT_CHANNEL.push(addedControllers[0].name)
var refreshTimeoutFunc;
var commandAvailable = true;
var recordsAvailable = true;
var creditAvailable = true;
var statsAvailable = true;
var leaderboardAvailable = true;
var requirementAvailable = true;
var countdownAvailable = true;
var infoAvailable = true;
var cnrAvailable = true;
var listening = true;
var listeningForGuesses = false;
var countdownTimer;
var ranks = ['d','d+','c-','c','c+','b-','b','b+','a-','a','a+','s-','s','s+','ss','u','x'];
var percentiles = [1,0.975,0.95,0.9,0.84,0.78,0.7,0.62,0.54,0.46,0.38,0.3,0.23,0.17,0.11,0.05,0.01]
var requirements = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var players = JSON.parse(fs.readFileSync('Code/players.txt'));
var outcomes = JSON.parse(fs.readFileSync('Code/outcomes.txt'));
var replayCount = outcomes.length;

var scoreTimeoutFunc;
var leadersTimeoutFunc;
var roundTimeoutFunc;
var listeningForGuesses = false;
var guesses = {};
var scores = {};
var leaderNames = ['nobody1', 'nobody2', 'nobody3', 'nobody4', 'nobody5']; 
var leaderScores = [0, 0, 0, 0, 0];
var scoreRequests = [];
var leadersAvailable = true; 
var qaAvailable = true; 
var lineNumber = 0; 
var roundNumber = 0;
var roundLimit = 0; 
var minimumPlayers = 10; 
var basePoints = [5,2,1];
var pointsMultiplier = 1;
var difference = [25,100,250];
var rangeMultiplier = 1;
var maxScoreRequests = 6; 
var scoreRequestBatchWait = 5000;
var leadersCooldownWait = 15000; 
var startTimer = 300;
var roundTimer = 240; 
var beginTimer = 30; 
var intermissionTimer = 30;
var gameStarted = false;
var joinAvailable = false;
var random = false;
var playingViewers = 0;
var replayTimeCount;
var surpriseRound = false;
var randomThreshold = 0.15;

fs.readFile('Code/scores.txt', (err, data) =>
{
	if (err) throw err;
	scores = JSON.parse(data);
	playingViewers = Object.keys(scores).length;
	if(playingViewers) updateLeaders();
});
//End
ConnectToTwitch(CHAT_CHANNEL);

const BOT_CONTROLLER = 'Rklplol';
var addedControllers;

async function onMessageHandler(target, context, msg, self)
{
	if(!gameStarted) if(self) { return; } 

	const commandName = msg;
	var t = target.substring(1, target.length);
	if((!CHAT_CHANNEL.includes(t))||(!commandName.startsWith('!'))||isBanned(context['username'])) return;

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

		if (commandName.startsWith('!bot')||commandName.startsWith('!info')||commandName.startsWith('!botinfo')||commandName.startsWith('!commands')) 
		{
			if(infoAvailable)
			{
				client.action(target, 'For commands, source code and instructions, check out my repository: https://github.com/Rklplol/MCC-bot');
				infoAvailable = false;
				setTimeout(function () { infoAvailable = true; }, 30000);
			}
		}

	//Guessing bot logic
		else if (commandName.startsWith('!gtr')&&isBotController(context['username']))
		{
			var ans = commandName.substring(4).trim();
			try{
				if(ans<0)
				{
					client.action(target, 'I\'m not sure, but amount of rounds can\'t be negative, 0 is fine though!');
					return;
				}
			}
			catch{
				client.action(target, 'I\'m not sure, but amount of rounds should be a number...');
				return;
			}
			roundLimit = ans;
			gameStarted = true;
			joinAvailable = true;
			//if (players.length > 0) //In case we want to save the players
				players = [];
			outcomes = [];
			scores = {};
			//fs.writeFileSync('Code/scores.txt')
			replayCount = 0;
			playingViewers = 0;
			outString = 'Game on! If you wish your TL replays to be featured, use !join [tetrio name]. If you don\'t get to ';
			outString += minimumPlayers;
			outString += ' players, random replays will be used. You have 5 minutes to join.';
			client.action(target, outString);

			var typed = [false, false];
			ans = startTimer*1000;
			var interval = 1000; // ms
			var expected = Date.now() + interval;
			setTimeout(step2, interval);
			function step2() {
    		var dt = Date.now() - expected;
		    ans = ans - interval - dt;
		    if(ans <= 0)
			{
				joinAvailable = false; 
				outString = 'Join period is over, but anyone can guess. I\'ve got ';
				outString += players.length;
				outString += ' players. ';
				if (players.length < minimumPlayers)
				{
					outString += ' That means, we\'re playing with absolutely random replays... ';
					random = true;
				}
				else
				{
					outString += ' That means, we\'re playing with our player list! '
					random = false;
				}
				outString += 'Starting in ';
				outString += beginTimer;
				outString += ' seconds';
				client.action(target, outString);
				setTimeout(function() {
					if(random) {outString = '!getreplay random'; client.action(target, outString);}
					else {outString = '!getreplay'; client.action(target, outString);}
				}, beginTimer*1000);
			}
			else if(ans <= 30000 && !typed[0])
			{
				typed[0] = true;
				client.action(target, '30 more seconds to join!');
			}
			else if(ans <= 60000 && !typed[1])
			{
				typed[1] = true;
				client.action(target, '60 seconds left to add a player');
			}

		    expected += interval;
		    if (ans>0 && gameStarted)
		    setTimeout(step2, Math.max(0, interval - dt));
			}			
		}

		else if (commandName.startsWith('!cd')&&(hasElevatedPermissions(t, context['username'])||(t == context['username'])))
		{
			var outString = '';
			var ans = commandName.substring(3).trim();
			if (!countdownAvailable)
			{
				if(ans == '')
				{
					clearTimeout(countdownTimer);
					client.action(target, 'Countdown cleared');
					countdownAvailable = true;
					return;
				}
				else
				{
					clearTimeout(countdownTimer);
					client.action(target, 'Previous countdown cleared');
					countdownAvailable = true;
				}

			}
			if (countdownAvailable && ans != '')
			{
				countdownAvailable = false;
				var typed = [false, false, false, false, false];
				outString = 'Starting in '
				outString += ans;
				outString += ' seconds'
				client.action(target, outString);
				ans *= 1000;

				var timestamp = [1000,2000,3000,5000,10000];
				for (var j = typed.length-1; j >= 0; j--)
				{
					if (ans > timestamp[j]) break;
					else typed[j] = true;
				}

				var interval = 1000; // ms
				var expected = Date.now() + interval;
				countdownTimer = setTimeout(step2, interval);
				function step2() {
	    		var dt = Date.now() - expected;
			    ans = ans - interval - dt;
			    if(ans <= 0)
				{
					client.action(target, 'Go!');
				}
			    else if(ans <= timestamp[0] && !typed[0])
				{
					typed[0] = true;
					client.action(target, '1');
				}
			    else if(ans <= timestamp[1] && !typed[1])
				{
					typed[1] = true;
					client.action(target, '2');
				}
				else if(ans <= timestamp[2] && !typed[2])
				{
					typed[2] = true;
					client.action(target, '3');
				}
				else if(ans <= timestamp[3] && !typed[3])
				{
					typed[3] = true;
					client.action(target, 'Ready');
				}
				else if(ans <= timestamp[4] && !typed[4])
				{
					typed[4] = true;
					client.action(target, 'Starting in 10 seconds');
				}

			    expected += interval;
			    if (ans>0)
			    countdownTimer = setTimeout(step2, Math.max(0, interval - dt));
				else countdownAvailable = true; 
				}
			}
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
								if(d<=1000 && d>0)
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
									outString = ans + (' needs ') + t.toFixed(2) + ' points to reach ' + u.data.user.league.next_rank.toUpperCase();
								}
								else if (d > 1000) 
									outString = 'Keep it going, '+ans+', you\'re getting there!';
								else 
									outString = 'On the next win, ' + ans + (' will be promoted to ') + u.data.user.league.next_rank.toUpperCase() + '!';
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
										if (requirements[i+1]-r > 0)
											outString = ans + (' needs ') + (requirements[i+1]-r).toFixed(2) + ' points to reach ' + ranks[i+1].toUpperCase();
										else
											outString = 'On the next win, ' + ans + (' will be promoted to ') + ranks[i+1].toUpperCase() + '!'; 
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
				setTimeout(function () { cnrAvailable = true; }, 30000);
			}
		}

		else if (commandName.startsWith('!nextrank'))
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
								if(u.data.user.league.next_at-u.data.user.league.standing<0)
								{
									var t = leaderboard.data.users[u.data.user.league.next_at].league.rating;
									outString = ans + (' needs ') + (t-r).toFixed(2) + ' points to reach ' + u.data.user.league.next_rank.toUpperCase();
								}
								else
								{
									outString = 'On the next win, ' + ans + (' will be promoted to ') + u.data.user.league.next_rank.toUpperCase() + '!';
								}
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
										if (requirements[i+1]-r > 0)
											outString = ans + (' needs ') + (requirements[i+1]-r).toFixed(2) + ' points to reach ' + ranks[i+1].toUpperCase();
										else
											outString = 'On the next win, ' + ans + (' will be promoted to ') + ranks[i+1].toUpperCase() + '!'; 
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
				setTimeout(function () { commandAvailable = true; }, 5000);
			}
		}

		else if (commandName.startsWith('!credits'))
		{
			if(creditAvailable)
			{
				outString = 'Made by Rklplol twitch.tv/Rklplol, using code from Manabender twitch.tv/Manabender and Andrea twitch.tv/andre_it_is. If you\'re from Tetris community, no matter who you are... I love you!';
				client.action(target, outString);
				creditAvailable = false;
				setTimeout(function () { creditAvailable = true; }, 100000);
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
				setTimeout(function () { statsAvailable = true; }, 5000);
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
							outString += ', global rank: ';
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
				setTimeout(function () { recordsAvailable = true; }, 10000);
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

		else if (commandName.startsWith('!refresh')&&(isBotController(context['username'])))
		{
			clearTimeout(refreshTimeoutFunc);
			leaderboardAvailable = true;
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
				setTimeout(function () { requirementAvailable = true; }, 30000);
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

		else if(gameStarted)
		{
			if (commandName.startsWith('!join'))
			{
				if(joinAvailable)
				{
					var ans = commandName.substring(5).trim();
					ans = (ans.toLowerCase()).replace(/[^0-9a-z_-\s]/g, "");
					var dupe = false;
					//Если найден игрок
					var inString = 'https://ch.tetr.io/api/users/' + ans;
					console.log(inString);
					await(fetch(inString))
					.then(u => u.json())
				    .then(json => u = json);
				    var outString = '';

				    if (u.success)
				    {
					    inString = 'https://ch.tetr.io/api/streams/league_userrecent_' + u.data.user._id;
						console.log(inString);
						await(fetch(inString))
							.then(t => t.json())
						    .then(json => t = json);
					}

					//Account for cases when u.data.user.league.gamesplayed > 0 but there exist no actual replays (Thanks, Wertj!) 
				    if(u.success && u.data.user.league.gamesplayed > 0 && t.data.records.length && !dupe)

				    if (u.success)
					    for (var i = 0; i < players.length; i++)
					    	if (players[i] == u.data.user._id)
					    	{
					    		dupe = true;
					    		break;
					    	}

				    if(u.success && u.data.user.league.gamesplayed > 0 && t.data.records.length && !dupe)
				    {
						players.push(u.data.user._id);
						console.log(u.data.user._id);
						fs.writeFile('Code/players.txt', JSON.stringify(players), (err) =>
						{
							if (err) throw err;
						});
						outString = 'Successfully added player ';
						outString += ans;
				    }
				    else if (dupe)
				    {
				    	outString = ans;
						outString += ' has already been added';
				    }
				    else if (u.success && u.data.user.league.gamesplayed == 0)
				    {
				    	outString = ans;
						outString += ' didn\'t play a single Tetra League match, shame on you!';
				    }
				    else if (!t.data.records.length)
				    {
				    	outString = ans;
						outString += ' doesn\'t have Tetra League replays available';
				    } 					
				    else
				    {
				    	outString = ans;
						outString += ' doesn\'t have a tetrio profile';
				    }
					client.action(target, outString);
				}
			}

			else if (commandName.startsWith('!outcome')&&hasElevatedPermissions(t, context['username']))
			{
				var ans = commandName.substring(8).trim();
				outString = 'Player1: ';
				outString += outcomes[ans-1].p1;
				outString += ', TR: ';
				outString += Math.round(outcomes[ans-1].p1tr);
				outString += ', Rank: ';
				outString += getRank(outcomes[ans-1].p1tr).toUpperCase();
				outString += ' Player2: ';
				outString += outcomes[ans-1].p2;
				outString += ', TR: ';
				outString += Math.round(outcomes[ans-1].p2tr);
				outString += ', Rank: ';
				outString += getRank(outcomes[ans-1].p2tr).toUpperCase();
				outString += '. 30 second intermission.';
				client.action(target, outString);

				var arg = [Math.round(outcomes[ans-1].p1tr), Math.round(outcomes[ans-1].p2tr)];

				var answers = {};
				for (var i = 0; i < arg.length; i++)
				{
					answers[i] = arg[i];
				}
				var correctAnswers = 0;
				var totalAnswers = 0;
				for (const [player, guess] of Object.entries(guesses))
				{
					//If the player isn't in the score table, add them.
					if (scores[player] == null)
					{
						playingViewers += 1;
						scores[player] = {};
						scores[player]['score'] = 0;
					}
					for(var i = 0; i < 2; i++)
					{
						if (guess[i]>=answers[i]-rangeMultiplier*difference[0] && guess[i]<=answers[i]+rangeMultiplier*difference[0])
						{
							scores[player]['score'] += pointsMultiplier*basePoints[0];
							correctAnswers++;
							totalAnswers++;
						}
						else if (guess[i]>=answers[i]-rangeMultiplier*difference[1] && guess[i]<=answers[i]+rangeMultiplier*difference[1])
						{
							scores[player]['score'] += pointsMultiplier*basePoints[1];
							totalAnswers++;
						}
						else if (guess[i]>=answers[i]-rangeMultiplier*difference[2] && guess[i]<=answers[i]+rangeMultiplier*difference[2])
						{
							scores[player]['score'] += pointsMultiplier*basePoints[2];
							totalAnswers++;
						}
						else totalAnswers++;
					}
				}
				fs.writeFileSync('Code/scores.txt', JSON.stringify(scores));
				client.action(target, 'There were '.concat(correctAnswers).concat(' very close answers out of a total of ').concat(totalAnswers).concat('.'));
				if(playingViewers) updateLeaders();
				
				if(roundNumber == roundLimit)
				{
					client.action(target, '!end');
					return;
				}

				var typed = false;
				var ans = intermissionTimer*1000;
				var interval = 1000; // ms
				var expected = Date.now() + interval;
				setTimeout(step3, interval);
				function step3() {
	    		var dt = Date.now() - expected;
			    ans = ans - interval - dt;
			    if(ans <= 0)
				{
					outString = 'New round started!';
					client.action(target, outString);
					if(random) {outString = '!getreplay random'; client.action(target, outString);}
					else {outString = '!getreplay'; client.action(target, outString);}
				}
				else if(ans <= 15000 && !typed)
				{
					typed = true;
					client.action(target, 'Resuming in 15 seconds');
				}

			    expected += interval;
			    if (ans>0&&gameStarted)
			    setTimeout(step3, Math.max(0, interval - dt));
				}
			}

			else if (commandName.startsWith('!getreplay')&&hasElevatedPermissions(t, context['username']))
			{
				var ans = commandName.substring(10).trim();
				ans = ans.replace(/[^0-9a-z_-\s]/g, "");
				rangeMultiplier = 1;
				pointsMultiplier = 1;
				surpriseRound = false;
				if(Math.floor(Math.random()*10)==0) rangeMultiplier = 2;
				if(Math.floor(Math.random()*10)==0) pointsMultiplier = 2;
				if(Math.floor(Math.random()*100)==0) surpriseRound = true;
				do
				{
					if (ans == 'random')
					{
						var number = Math.floor(Math.random() * (leaderboard.data.users.length*randomThreshold-1));
						var inString = 'https://ch.tetr.io/api/streams/league_userrecent_' + leaderboard.data.users[number]._id;
					}
					else
					{
						var number = Math.floor(Math.random() * (players.length-1));
						var inString = 'https://ch.tetr.io/api/streams/league_userrecent_' + players[number];
					}

					var outString = '';
					console.log(inString);
					await(fetch(inString))
						.then(u => u.json())
					    .then(json => u = json);
					if(!u.success)
					{
						outString = 'Something went wrong with getting replays list';
						client.action(target, outString);
						return;
					}
					else
					{
						var games = u.data.records;
						number = Math.floor(Math.random() * (games.length-1));
						games = games[number];
						await(fetch('https://tetr.io/api/games/'+games.replayid,{
							headers: {
			   				 Authorization: tetrio
			  				}
		 				 }))
						.then(u => u.json())
						.then(json => u = json.game);

						if(u.data.length < 3)
						{
							outString = 'Not worth being a guessing replay, trying again';
							client.action(target, outString);
						}
						else
						{
							var board = u.data[0].board;
							var u1 = board[0].user.username;
							var u2 = board[1].user.username;
							var found1 = -1, found2 = -1;

							for (var i = 0; i < leaderboard.data.users.length ; i++)
							{
								if (leaderboard.data.users[i].username == u1)
									found1 = i;
								if (leaderboard.data.users[i].username == u2)
									found2 = i;
							}
							var match;
							if(found1>=0&&found2>=0)
							{
								match = {

									p1: u1,
									p1tr: leaderboard.data.users[found1].league.rating,
									p2: u2,
									p2tr: leaderboard.data.users[found2].league.rating
								}
							}
							else if (found1 == -1)
							{
								inString = 'https://ch.tetr.io/api/users/' + u1;
								console.log(inString);
								var t = null; 
								await(fetch(inString))
								.then(t => t.json())
						    	.then(json => t = json);
						    	if(t.success){
						    	match = {
									p1: u1,
									p1tr: t.data.user.league.rating,
									p2: u2,
									p2tr: leaderboard.data.users[found2].league.rating
								}
								}
								else{
								match = {
									p1: u1,
									p1tr: 0,
									p2: u2,
									p2tr: leaderboard.data.users[found2].league.rating
								}
								}
							}
							else 
							{
								inString = 'https://ch.tetr.io/api/users/' + u2;
								console.log(inString);
								var t = null;
								await(fetch(inString))
								.then(t => t.json())
						    	.then(json => t = json);
						    	if(t.success){
						    	match = {
									p1: u1,
									p1tr: leaderboard.data.users[found1].league.rating,
									p2: u2,
									p2tr: t.data.user.league.rating
								}
								}
								else{
								match = {
									p1: u1,
									p1tr: leaderboard.data.users[found1].league.rating,
									p2: u2,
									p2tr: 0
								}
								}
								
							}
							outcomes.push(match);
							fs.writeFile('Code/outcomes.txt', JSON.stringify(outcomes), (err) =>
									{
									    if (err) throw err;
									});

							var num_games = 0;
							replayTimeCount = 0;
							var wins1 = 0, wins2 = 0;
							for(var i = 0; i < u.data.length; i++)
							{
								for(var j = 0; j < u.data[i].board.length; j++)
									if (u.data[i].board[j].user.username == u1 && u.data[i].board[j].success)
							        {
							        	wins1 += 1;
							        	replayTimeCount += u.data[i].replays[0].frames;
							        }    
							        else if (u.data[i].board[j].user.username == u2 && u.data[i].board[j].success)
							        {
							        	wins2 += 1;
							        	replayTimeCount += u.data[i].replays[0].frames;
							        }    
							    num_games += 1;
							    if (wins1 == 3||wins2 == 3)
							        break;
							}
							console.log("Replay time: "+replayTimeCount+" frames");
							replayTimeCount = Math.ceil(replayTimeCount/60);
							u.data.splice(num_games,u.data.length-num_games);  
							var string = JSON.stringify(u);
							string = string.replace(new RegExp(u1, "g"), 'player1');
							string = string.replace(new RegExp(u2, "g"), 'player2');
							replayCount += 1;
						    fs.writeFileSync('Code/game'+replayCount+'.ttrm', string);
							bot.channels.cache.get(discordRoom).send('',{
			            	files: ['Code/game'+replayCount+'.ttrm']
			            	})
			           		 .then(msg => {
								try {
									fs.unlinkSync('Code/game'+replayCount+'.ttrm');
								} 
								catch(err) 
								{
								console.error(err);
								}
			           		 })
			            	.catch(console.error);

			            	outString = 'Replay ';
			            	outString += replayCount;
			            	outString += ' is in Discord (https://discord.gg/SVG8hvQUKM) (discord-bot channel)';
			            	client.action(target, outString);
			            	outString = '!open';
			            	client.action(target, outString);
						}	
					}
				} while(u.data.length < 3);			
			}

			else if (commandName.startsWith('!open') && hasElevatedPermissions(t, context['username']))
			{
				roundNumber++;
				guesses = {};
				var outString = '';
				listeningForGuesses = true;
				if(rangeMultiplier == 2)
				{
					outString += 'Double TR range! ';
				}
				if(pointsMultiplier == 2)
				{
					outString += 'Double points! ';
				}
				if(surpriseRound == true)
				{
					roundTimer = 10;
					outString += 'Armageddon! Type !guess (TR of P1) (TR of P2) FAST!. You have 10 seconds!';
					client.action(target, outString);
				}
				else
				{
					roundTimer = (replayTimeCount+80)>240?240:(replayTimeCount+80); 
					outString += 'Guessing is open for round ';
					outString += replayCount;
					outString += '! Type !guess (TR of P1) (TR of P2) to submit your answer choice. You have ';
					outString += roundTimer;
					outString += ' seconds.';
					client.action(target, outString);
				}
					var typed = false;
					var ans = roundTimer*1000;
					var interval = 1000;
					var expected = Date.now() + interval;
					setTimeout(step4, interval);
					function step4() {
		    		var dt = Date.now() - expected;
				    ans = ans - interval - dt;
				    if(ans <= 0)
					{
						listeningForGuesses = false;
						fs.writeFile('Code/guesses.txt', JSON.stringify(guesses), (err) => //Write main guess file
						{
							if (err) throw err;
							console.log('> Guess file written');
						}
						);
						client.action(target, '!outcome '.concat(replayCount));
					}
					else if(ans <= 20000 && !typed)
					{
						typed = true;
						client.action(target, '20 seconds left to make your guess!');
					}
				    expected += interval;
				    if (ans>0 && gameStarted)
				    setTimeout(step4, Math.max(0, interval - dt));
				}
			}

			if (commandName.startsWith('!guess'))
			{
				if (listeningForGuesses)
				{
					var guesser = context['username'];
					var ans = commandName.match(/[-+]?[0-9]*\.?[0-9]+/g);
					try{
						if (ans.length == 2) ///Error here
						{
							guesses[guesser] = ans;
						}
						else
						{
							outString = guesser;
							outString += ', answer is in incorrect form. Try again.';
							client.action(target, outString);
						}
					}
					catch
					{
						outString = guesser;
						outString += ', answer is in incorrect form. Try again.';
						client.action(target, outString);
					}
				}
				else
				{
					console.log('> '.concat(guesser).concat(' tried to guess ').concat(ans).concat(' but guessing isn\'t open right now'));
				}
			}

			else if (commandName.startsWith('!score'))
			{
				const player = context['username'];
				console.log('Score command used by '.concat(player));
				scoreRequests.push(player);

				function batchPostScores()
				{
					console.log('Batch-posting score requests');
					var outString = "";
					for (const player of scoreRequests)
					{
						var score = 0;
						if (scores[player] == null) //Player not in score table.
						{;}
						else
						{
							score = scores[player]['score'];
						}
						outString = outString.concat('@').concat(player);
						outString = outString.concat(' Your score is ').concat(score).concat(' ');
					}
					client.action(target, outString);
					scoreRequests = [];
				}

				if (scoreRequests.length == 1)
				{
					scoreTimeoutFunc = setTimeout(batchPostScores, scoreRequestBatchWait);
				}
				else if (scoreRequests.length >= maxScoreRequests)
				{
					clearTimeout(scoreTimeoutFunc);
					batchPostScores();
				}
			}

			else if (commandName.startsWith('!unguess'))
			{
				var guesser = context['username'];
				if (listeningForGuesses)
				{
					guesses[guesser] = {};
				}
				else
				{
					console.log('> '.concat(guesser).concat(' tried to unguess ').concat(ans).concat(' but guessing isn\'t open right now'));
				}
			}

			else if (commandName.startsWith('!leaders'))
			{
				if (leadersAvailable)
				{
					console.log('> Leaders command used');
					var outString = '';
					var playerCount = (playingViewers >= 5) ? 5 : playingViewers;
					if(playerCount == 0)
					{
						client.action(target, 'There are currently no players');
						return;
					}
					for (var i = 1; i <= playerCount; i++)
					{
						outString = outString.concat(i).concat('. ');
						outString = outString.concat(leaderNames[i - 1]).concat(': ');
						outString = outString.concat(leaderScores[i - 1]).concat('  ');
					}
					client.action(target, outString);
					leadersAvailable = false;
					leadersTimeoutFunc = setTimeout(function () { leadersAvailable = true; }, leadersCooldownWait);
				}
				else
				{
					console.log('> Leaders command used but currently on cooldown');
				}
			}

			else if (commandName.startsWith('!end') && isBotController(context['username']))
			{
				outString = 'Game has been ended!';
				client.action(target, outString);
				console.log('Leaders command used');
					var outString = '';
					var playerCount = (playingViewers >= 5) ? 5 : playingViewers;
					if(playerCount == 0)
					{
						client.action(target, 'There are currently no players');
						return;
					}
					for (var i = 1; i <= playerCount; i++)
					{
						outString = outString.concat(i).concat('. ');
						outString = outString.concat(leaderNames[i - 1]).concat(': ');
						outString = outString.concat(leaderScores[i - 1]).concat(' ');
					}
					client.action(target, outString);
				gameStarted = false;
				clearTimeout(roundTimeoutFunc);
			}
		}

		else if (commandName.startsWith('!recover') && isBotController(context['username']))
		{
			gameStarted = true;
			console.log('> Used recover command');
			scores = JSON.parse(fs.readFileSync('Code/scores.txt'));
			client.action(target, 'The bot has recovered from a crash or reboot in the middle of a match. This round will be skipped.');
			if(random) {outString = '!getreplay random'; client.action(target, outString);}
			else {outString = '!getreplay'; client.action(target, outString);}
		}
	}
}

function isBotController(user)
{
	if (user == BOT_CONTROLLER.toLowerCase() || user == username)
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
		console.log(leaderboard);
		if (leaderboard != [])
		{
			if(leaderboard.cache == 'hit')
				if(leaderboard.cache.cached_until>Date.now());
				{
					leaderboardAvailable = false;
					console.log("Fetching leaderboard from X-session-id");
					var inString = 'https://ch.tetr.io/api/users/lists/league/all';
					await(fetch(inString,{
						headers: {
		   				 "X-Session-Id": tetriosession
		  				}
	 				 }))
					.then(leaderboard => leaderboard.json())
					.then(json => leaderboard = json);
					console.log("Fetching done from X-session-id");
					console.log("Finding rank requirements");
					var currentPlace = leaderboard.data.users.length - 1;
					for (var i = 0; i < ranks.length; i++) {
						requirements[i] = Math.round(leaderboard.data.users[Math.round(currentPlace*percentiles[i])].league.rating);
					}
					console.log("Rank requirements operation completed");
					refreshTimeoutFunc = setTimeout(function () { leaderboardAvailable = true; }, 3600000);
					var string = JSON.stringify(leaderboard);
					fs.writeFile('Code/leaderboard.txt', string, (err) =>
					{
						if (err) throw err;
					});
					return;
				}
		}

		leaderboardAvailable = false;
		console.log("Fetching leaderboard for the first time");
		var inString = 'https://ch.tetr.io/api/users/lists/league/all';
		await(fetch(inString,{
						headers: {
		   				 "X-Session-Id": tetriosession
		  				}
	 				 }))
			.then(leaderboard => leaderboard.json())
			.then(json => leaderboard = json);
		console.log("Fetching done");
		console.log("Finding rank requirements");
		var currentPlace = leaderboard.data.users.length - 1;
		for (var i = 0; i < ranks.length; i++) {
			requirements[i] = Math.round(leaderboard.data.users[Math.round(currentPlace*percentiles[i])].league.rating);
		}
		console.log("Rank requirements operation completed");
		refreshTimeoutFunc = setTimeout(function () { leaderboardAvailable = true; }, 3600000);
		var string = JSON.stringify(leaderboard);
		fs.writeFile('Code/leaderboard.txt', string, (err) =>
		{
			if (err) throw err;
		});
	}
}

function isBanned(channel)
{
	for (var j = 0; j < addedControllers[0].banlist.length; j++)
		if(addedControllers[0].banlist[j].toLowerCase() == channel)
			return true;
	return false;
}

function getRank(value)
{
	if(value > requirements[requirements.length-1])
		return ranks[requirements.length-1];
	if(value < requirements[0])
		return 'z';
	for (var i = 1; i < requirements.length; i++)
		if(value > requirements[i-1] && value <= requirements[i])
		{
			return ranks[i-1];
		}
}

function updateLeaders()
{
	leaderNames = ['nobody1', 'nobody2', 'nobody3', 'nobody4', 'nobody5'];
	leaderScores = [0, 0, 0, 0, 0];
	for (const [player, scoreObj] of Object.entries(scores))
	{
		const score = scoreObj['score'];
		var playerCount = (playingViewers >= 5) ? 5 : playingViewers;
		for (var i = 0; i < playerCount; i++)
		{
			if (score > leaderScores[i])
			{
				for (var j = playerCount-1; j > i; j--)
				{
					leaderNames[j] = leaderNames[j - 1];
					leaderScores[j] = leaderScores[j - 1];
				}
				leaderNames[i] = player;
				leaderScores[i] = score;
				break;
			}
		}
	}
}

