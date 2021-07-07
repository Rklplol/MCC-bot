## Short summary
Twitch multi-channel companion bot is intended to be used as a support to other available bots with limited functionality.
At the current state, grabs data from Tetr.io API.

## Credits
Manabender for making guessing bot available to anyone (barebones code to run a bot is his)
https://github.com/Manabender/Underdogs-Cup-Twitch-Guessbot
Andrea for making the base of !stats command and sparkling the need of this bot
https://twitch.tv/andre_it_is

## Can I use it?
Yes, you can use it, but use it responsibly. You will need some JavaScript knowledge to create your own commands though.
But, assuming you know how to use it, I don't mind if you do. It would be nice if you gave credit where credit is due, of course.

## How can I use it?

#### Running a bot on your computer from source code
1. Create a Twitch profile dedicated to your bot.
2. Get your bot's OAuth code at https://twitchapps.com/tmi/ 
3. Download this code.
4. Insert your bots name and OAuth code in Code/credentials.js
module.exports = {
    username : '', //Bot name here  
    password : '' //Bot OAuth here
}
5. Add or remove the channels in twitchbot.js to your taste.
6. Add or remove bot controllers in config.js to your taste.
7. Download Node.js from the official website. (versions from 10.* should work fine)
8. Install necessary libraries: 
	npm install fs
	npm install tmi.js
	npm install node-fetch
9. Insert the code into Node.js folder
10. Run LaunchBot.bat

#### Running a bot on your computer from release file (to be released)

1. Make a bot profile 
2. Get its OAuth https://twitchapps.com/tmi/ (OAuth of a bot profile, not yours) 
3. Insert your bots name and OAuth code in Code/credentials.js
module.exports = {
    username : '', //Bot name here  
    password : '' //Bot OAuth here
}
4. Run LaunchBot.bat

#### Running a bot on a hosting (to be learned)

Yet to be added.

## User commands

The following commands can be used by anyone in chat.

#### !stats [name]

####

## Controller commands
The following commands can only be used by registered bot controllers. This includes the bot owner and anyone that the owner has registered as a controller. (Note that bot controllers are still able to use the above user commands, and are still able to participate in the guessing game.)
