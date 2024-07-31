# Slot Bot by @Sparkle | kda_delta (discord)

![Slot Bot](https://img.shields.io/badge/Slot%20Bot-v1.0-blue.svg)

## Introduction

Slot Bot is a Discord bot developed for educational purposes to manage slots in a Discord server. The bot provides various commands to create, manage, and revoke slots for users. Note that any misuse of this bot is not the responsibility of the creator.

## Features

- Set, hold, unhold, and stop user slots.
- Extend slot time.
- Manage slot category and permissions.
- Mention @everyone or @here with usage limits.
- List active slots.

## Commands

### User Slot Management

- **!setslot <user> <duration>**: Set a slot for a user. Duration can be 'w' for weeks, 'm' for months, or 'lifetime' for an infinite duration.
- **!addtime <user> <duration>**: Add time to a user's slot. Duration can be 'w' for weeks, 'm' for months, or 'min' for minutes.
- **!hold <user>**: Put a user's slot on hold.
- **!unhold <user>**: Release a user's slot from hold.
- **!stop <user>**: Stop a user's slot and lock the associated channel.
- **!revoke <user> <reason>**: Revoke a user's slot for a specified reason and delete the associated channel.

### Mention Commands

- **!everyone**: Mention @everyone (limited to once per day per user).
- **!here**: Mention @here (limited to once per day per user).

### Slot Management

- **!active_slots**: List all active slots and their expiration times.
- **!setcategory <category_id>**: Set the category for slot channels.

### Help

- **!help**: Display the list of available commands.

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/KDA-sparkle/Slot-Bot-discord.git
   cd slot-bot
   ```

2. Install the required modules:
   ```sh
   npm install discord.js
   ```

3. Create a `config.json` file in the root directory with the following structure:
   ```json
   {
     "token": "YOUR_BOT_TOKEN",
     "owner": ["OWNER_ID1", "OWNER_ID2"],
     "prefix": "$"
   }
   ```

4. Run the bot:
   ```sh
   node bot.js
   ```

## Getting Your Bot Token

To get your bot token, follow these steps:
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a new application.
3. Navigate to the "Bot" section and create a new bot.
4. Copy the bot token and paste it into your `config.json` file.

## Disclaimer

This bot is created for educational purposes only. Any misuse of this bot is not the responsibility of the creator. Use it wisely and respect the Discord terms of service.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Contact

For any questions or issues, feel free to open an issue on GitHub or contact me on Discord at `kda_delta`.

---

Happy coding!


Replace `"YOUR_BOT_TOKEN"`, `"OWNER_ID1"`, and `"OWNER_ID2"` with your actual bot token and owner IDs. You can also customize the repository link and contact information as per your preferences.
