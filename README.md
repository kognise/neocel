> 🚧 **This project is maintenance mode!** 🚧
> 
> I will be fixing and responding to pull requests and issues, but it is not in active development.

# Neocel

A command-line tool to quickly deploy static sites to Neocities. Free web hosting = stonks!

## Quick Start

You'll need Node.js and a Neocities account to get started. You can make an account [here](https://neocities.org/) if for some reason you don't have one already.

```
npm install -g neocel
```

You'll need an API token to use this tool, but luckily there's a bundled tool to generate one. Make sure to use your Neocities username and password, and copy the token when it prints!

```
neocel token <username> <password>
```

Now, just deploy a site! You can deploy the current folder with `neocel -t <token>`.

## CLI Options

Here's a delightful table I made of all the flags and what they do. You can also use `neocel token <username> <password>` to generate an API token.

| Flag          | Description                          |
| ------------- | ------------------------------------ |
| --help, -h    | Show flags and usage information     |
| --version, -v | Show the currently installed version |
| --token, -t   | Set the Neocities API key            |
| --yes, -y     | Accept all yes/no prompts            |
| --dir, -d     | Change the directory to deploy       |

Keep in mind if you set the `NEOCITIES_TOKEN` environment variable you won't have to manually set the token! This can also be useful in CI environments.

## Why?

Idk dude, people make weird things when they're ~~high~~ tired. I ask you: why not?
