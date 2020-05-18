# Jenkins-Discord-Bot

A discord webhook "bot" that allows you to send message to discord from your jenkins server when a job has:
 - Succeeded: A job was finished successfully
 - Unstable: A job didn't finish quite well.
 - Failure: A job didn't complete successfully due errors.
 
 A webhook is used to connect the "bot" to discord and SendMessageToDiscord has to be called from Jenkins itself.
 A message will be send to discord through the use of an embed.
 
 **The bot supports:**
 - Giphy: place the giphy key inside config.json, uses: https://www.npmjs.com/package/giphy-api
 
 **NOTE**
 To use the bot you need to have the giphy-api installed to do so use:
 ```
 npm install giphy-api --save
 ```
 inside the root folder and you're ready to use the bot.
 
 ## How to setup
 Using config.json you can customize what the bot needs to send out to discord, each stage of a job has a seperate message where the message contains:
   - "header" is the message that will be send as the header/title of the discord message
   - "embed_color" is the color of the embeded message
   - "Url" is an url that will be 'attached' to the header text. If no URL is defined will not show a clickable link.
   - "giphy"
     - "key" the key used by your giphy dev account see https://developers.giphy.com/
     - "random_limit" the amount of images giphy can choose from.
     - "rating" the MPAA rating system to use when looking for images.
   
The webhook for discord can also be set in the config.json using "webhook_url".

## Calling the bot from Jenkins
In order to run the bot you need to have Node installed on the Jenkins server. Then you can use the SendMessageToDiscord.bat file to 
tell the bot to send a message to discord using the given webhook.

The .bat and the bot have 3 arguments you can set when calling the batch file:
1. Pass in an argument denoting what stage the job has reached: 
    - Success: "1"
    - Unstable: "2"
    - Failed: "3"
2. Pass in the giphy keyword as the second argument, example: "Good job"
3. Pass in the content message for the discord message, example: "Build was successfull!"
4. Pass in the details of your build (will be denoted in a small subtext in the message), example: "%JOB_BASE_NAME% (%BUILD_NUMBER%)"

An example on how to call the batch file:
```Shell
call SendMessageToDiscord.bat "1" "good job" "%CONFIGURATION%(%PLATFORM%) **%BUILD_KIND%** build has succeeded: %BUILD_URL%" "%JOB_BASE_NAME% (%BUILD_NUMBER%)"
```
