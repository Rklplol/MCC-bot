## Disclaimer

Though the program has been tested for some time, I do not expect it to be 100% reliable at all times (especially at the early stages of development).

In case of problems, or if you have questions, suggestions and/or feedback, you have several ways to contact me.

* [On Twitch](https://twitch.tv/Rklplol)
* [On Discord](https://discord.gg/kXbqmsTn8Q)
* Create the issue in this repository

Tracking the progress in [Trello](https://trello.com/b/GcAJmyme/mcc-bot)

## Short summary
Twitch multi-channel companion bot is intended to be used as a support to other available bots with limited functionality.
At the current state, grabs data from Tetr.io API and Twitch API.

## Can I use it?
Yes, you can use it, but use it responsibly. You will need some JavaScript knowledge if you want to create your own commands.
Author crediting is appreciated, of course.

## How can I use it?

#### Running a bot without needing to do anything

Asking me through available sources (mentioned above)

I'm currently running a server-side multi-channel version of this bot.

Pros:
- No need to create a new bot profile
- Bot is working almost 24/7, depending on the server uptime 
- No need to create a new process on your computer and use your own CPU power

Cons:
- "Bot controller" role is assigned to me 
- Commands can be added only through me and making a new version, and to make it in, you need to have a strong justification
- The server still may shut down the process (though it won't be my fault)
- In case of unexpected restart, channel information may be reset (will work on it, just keep that in mind and don't hesitate to ask me)

#### Running a bot on your computer from source code

1. Create a Twitch profile dedicated to your bot.
2. Get your bot's [OAuth code](https://twitchapps.com/tmi/) 
3. Create the fork and clone it or download this code.
4. Insert your bots name and OAuth code in Code/credentials.js

``` javascript
module.exports = {
    username : '', //Bot name here  
    password : '', //Bot OAuth here
    auth: '',
    client_id: ''
}
```

**Note, that *auth* and *client_id* are only responsible for Twitch API commands (!randomstream), if you don't have them - no problem, just leave them empty.**

5. Open Code/users.txt and change the "name" to your channel name.

6. Download [Node.js](https://nodejs.org/en/download/) from the official website. (versions from 10.* should work fine)

7. Install necessary libraries: 
``` bash
    npm install fs
    npm install tmi.js
    npm install node-fetch 
```
8. Insert the code into Node.js folder
9. Run LaunchBot.bat

#### Running a bot on your computer from release file

1. Make a bot profile 
2. Get its OAuth https://twitchapps.com/tmi/ (OAuth of a bot profile, not yours) 
3. Create the fork and clone it or download this code.
4. Insert your bots name and OAuth code in Code/credentials.js

``` javascript
module.exports = {
    username : '', //Bot name here  
    password : '', //Bot OAuth here
    auth: '',
    client_id: ''
}
```
**Note, that *auth* and *client_id* are only responsible for Twitch API commands (!randomstream), if you don't have them - no problem, just leave them empty.**

5. Open Code/users.txt and change the "name" to your channel name.

6. Run LaunchBot.bat

## Commands overview

As of version 1.0, commands are divided into 5 layers of accessibility:

1. Bot controller
2. Owner (though in this case - owner = bot controller)
3. Moderator
4. User
5. Restricted user

Users of an access group can use all the commands of lower groups.
For example, moderators as group 3, can also use the commands from groups 4-5.

#### Restricted user

Though, these users aren't really restricted from chatting, at the current state, they do NOT have access to bot commands.

#### User

!nextrank [name] - shows how many points are needed to reach next Tetr.io rank - 5-second cooldown

!stats [name] - shows Tetra League stats of a certain player (rank, TR, PPS, APM, VS) -  5 second cooldown

!records [name] - shows 40L sprint and Blitz records of a certain player - 10 second cooldown (**NOTE: The bot WILL be muted if it's not a moderator and there's link moderation by AutoMod or other known bots**)

!requirements [blank, all or certain rank] - shows TR requirement to achieve corresponding rank or ranks - 30 second cooldown

!credits - speaks for itself - 100 second cooldown (**NOTE: The bot MAY be muted if it's not a moderator and there's link moderation by other known bots**)

!bot, !info, !botinfo or !commands - shows information about the bot and commands - 30 second cooldown (**NOTE: The bot WILL be muted if it's not a moderator and there's link moderation by AutoMod or other known bots**)

#### Moderator

!start - starts the bot

!stop - stops the bot

!ban - bans a user from using the bot

!unban - lifts a ban from user

!currentnextrank [name] - same, as !nextrank, but in real time (use only if necessary), 30 second cooldown

#### Owner

!addmod [name] - adds a bot moderator

!removemod [name] - removes user from bot moderators

!setbotname [name] - sets bot's name (not the Twitch name though)

!randomstream - if auth and channel_id provided, gives random Tetr.io streamer

#### Bot controller

!refresh (multi-channel only) - calls FetchLeaderboard function which updates the leaderboard and the rank requirements

!addchannel [name] (multi-channel only) - adds the bot to the channel

!removechannel [name] (multi-channel only) - removes the bot from the channel 

#### Caveats

If channel chat is set to follower-only, your bot needs to follow your channel (unless you use your own profile as a bot, which isn't recommended, though possible) or make it a moderator

If channel is sub-only, the only choice is to make the bot a moderator, unless you want to spend 5 dollars for no reason.

In certain cases, bot may produce two messages with the same content in the span of 30 seconds. Twitch will block the second message. If you need it to be shown both times you have to make the bot a moderator too.

Should be obvious, but banning the bot from the Twitch chat makes it unable to function (Same result can be achieved by stopping the bot, using !stop command)
