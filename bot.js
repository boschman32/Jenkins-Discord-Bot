const assert = require('assert');
const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

class jenkins_arguments
{
    constructor()
    {
        this.succession = false;
        this.content = "";
        this.builddetails = "";
    }
}

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
            message.header = configData['build-message']['onsucceed'];
        }
        else
        {
            message.header = configData['build-message']['onfailed'];
        }
        message.footer = jenkinsArgs.builddetails;
        message.color = 'FF0000';
        discord.send(message);
    }
    catch(error)
    {
        assert(false, error);
    }
}
    
//Discord
class discord_data
{
    constructor()
    {
        this.url = null;
        this.name = null;
    }
};

class Message
{
    constructor()
    {
        this.header = "";
        this.content = "";
        this.footer = "";
        this.color = 0xc8702a;
    }
}

class Discord
{
    constructor(config)
    {
        this.data = new discord_data();
        this.data.url = config['discord']['webhook_url'];
        this.data.name = config['discord']['name'];
        this.webhook = new Webhook(this.data.url);
    }

    send(message)
    {
        if(this.webhook != null)
        {
            var embed = new Embed(message.header, message.content, 0xc8702a);
            embed.set_footer(message.footer);

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

    // get data()
    // {
    //     return this.data;
    // }
}

//Webhook
class Webhook
{
    constructor(url)
    {
        this.url = url;
        this.data = {};
    }

    add_embed(embed)
    {
        this.data["embeds"] = []
        this.data["embeds"].push(embed.data);
    }

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

//Entry
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