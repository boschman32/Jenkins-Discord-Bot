const assert = require('assert');
const https = require('https');
const fs = require('fs');

//Arguments passed down by the user to the bot.
class jenkins_arguments
{
    constructor()
    {
        this.succession = false;
        this.content = "";
        this.builddetails = "";
    }
}
    
//Discord data used by the webhook.
class discord_data
{
    constructor()
    {
        this.url = null;
    }
};

//Message data to send to discord
class Message
{
    constructor()
    {
        this.header = "";
        this.content = "";
        this.footer = "";
        this.color = 0xc8702a;
        this.imageUrl = null;
    }
}

class Discord
{
    constructor(config)
    {
        this.data = new discord_data();
        this.data.url = config['discord']['webhook_url'];
        this.webhook = new Webhook(this.data.url);
    }

    //Send a message to discord using the webhook
    send(message)
    {
        if(this.webhook != null)
        {
            var embed = new Embed(message.header, message.content, message.color);
            embed.set_footer(message.footer);

            if(message.imageUrl != null)
            {
                embed.set_image(message.imageUrl);
            }

            this.webhook.add_embed(embed);
            this.webhook.execute();
        }
        else
        {
            assert(false, "Discord was not initialized...");
        }
    }
}

class Embed
{
    constructor(title, description, color)
    {
        this.data = {};
        this.data["title"] = title;
        this.data["description"] = description;
        this.data["color"] = color;
    }

    set_footer(text) 
    {
        this.data["footer"] = {};
        this.data["footer"]["text"] = text;
    };

    set_image(imageUrl)
    {
        this.data["image"] = 
        {
            "url" : imageUrl
        }
    }
}

//Webhook used to connect to discord
class Webhook
{
    constructor(url)
    {
        this.url = url;
        this.data = {};
        this.data["tts"] = false;
    }

    add_embed(embed)
    {
        this.data["embeds"] = []
        this.data["embeds"].push(embed.data);
    }

    //Fire the webhook to discord with message JSON data.
    execute()
    {
        var postData = JSON.stringify(this.data);
        var options =
        {
            hostname: 'discordapp.com',
            path: this.url,
            method: 'POST',
            headers: 
            {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        var req = https.request(options, (res) =>
        {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS:
            ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => 
            {
                console.log(`BODY: ${chunk}`);
            });
            res.on('end', () =>
            {
                console.log('No more data in response...');
            });
        });
        req.on('error', (e) =>
        {
            console.log(`Problem with request: ${e.message}`);
        });
        req.write(postData);
        req.end();
    }
}

//Create a message using the jenkings command arguments
function construct_message(jenkinsArgs)
{
    try
    {
        var configData = JSON.parse(fs.readFileSync('config.json'));
        var discord = new Discord(configData);
        var message = new Message();
        message.content = jenkinsArgs.content;
        
        if(jenkinsArgs.succession)
        {
            var successMessage = configData['build-message']['onsucceed'];
            message.header = successMessage['message'];
            message.color = parseInt(successMessage['embed_color']);
            message.imageUrl = successMessage['image_url']
        }
        else
        {
            var failedMessage = configData['build-message']['onfailed']
            message.header = failedMessage['message'];
            message.color = parseInt(failedMessage['embed_color'])
            message.imageUrl = failedMessage['image_url']
        }
        message.footer = jenkinsArgs.builddetails;
       
        discord.send(message);
    }
    catch(error)
    {
        assert(false, error);
    }
}

//Entry - start of bot
var args = new jenkins_arguments();
var succeeded = String(process.argv[2]);
if(succeeded == 'true')
{
    args.succession = true;
}
else 
{
    args.succession = false;
}
args.content = String(process.argv[3]);
args.builddetails = String(process.argv[4])
//Send the message to discord.
construct_message(args);