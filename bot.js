const assert = require('assert');
const https = require('https');
const fs = require('fs');
const giphy = require('giphy-api')('JMkaAnrH3tu3QWbL2Cf7ci3fCQApJdUP');

const BuildLevels = Object.freeze({"on_success":1, "on_success_unstable":2, "on_failed":3})

//Arguments passed down by the user to the bot.
class jenkins_arguments
{
    constructor()
    {
        this.build_level = BuildLevels.on_success;
        this.giphy_keyword = "";
        this.content = "";
        this.build_details = "";
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
                'Content-Type': 'application/json',
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

function get_random_integer(max)
{
    return Math.floor(Math.random() * Math.floor(max));
}

//Create a message using the jenkings command arguments
function construct_message(jenkins_args)
{
    try
    {
        var config_data = JSON.parse(fs.readFileSync('config.json'));
        var discord = new Discord(config_data);
        var message = new Message();
        message.content = jenkins_args.content;
        
        if(jenkins_args.build_level == BuildLevels.on_success)
        {
            var success_message = config_data['build_message']['on_success'];
            message.header = success_message['message'];
            message.color = parseInt(success_message['embed_color']);
        }
        else if(jenkins_args.build_level == BuildLevels.on_success_unstable)
        {
            var success_message = config_data['build_message']['on_success_unstable'];
            message.header = success_message['message'];
            message.color = parseInt(success_message['embed_color']);
        }
        else
        {
            var failed_message = config_data['build_message']['on_failed']
            message.header = failed_message['message'];
            message.color = parseInt(failed_message['embed_color'])
        }

        message.footer = jenkins_args.build_details;
       
        giphy.search({
            q : jenkins_args.giphy_keyword,
            limit : 50,
            rating : 'r'
        }, function(err, ress)
        {
            if(err != null)
            {
                console.log("Error { " + err.name +"} getting ghiphy image: " + err.message);
            }
            else
            {
                //message.imageUrl = ress.data.images.original.url;
                if(ress.data.length > 0)
                {
                    message.imageUrl = ress.data[get_random_integer(ress.data.length - 1)].images.original.url;
                }
                else
                {
                    console.log("Couldn't find any images for phrase: "+ jenkins_args.giphyKeyword);
                }
            }
            discord.send(message);
        });
    }
    catch(error)
    {
        assert(false, error);
    }
}
    
//Entry - start of bot
var args = new jenkins_arguments();
var build_level = String(process.argv[2]);
args.build_level = build_level;
args.giphy_keyword = String(process.argv[3]);
args.content = String(process.argv[4]);
args.build_details = String(process.argv[5]);

//Send the message to discord.
construct_message(args);