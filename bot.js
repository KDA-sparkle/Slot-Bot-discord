const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs");

function loadConfig() {
  let config = JSON.parse(fs.readFileSync("config.json", "utf-8"));
  return [config.token, config.owner, config.prefix];
}

const [token, owner, prefix] = loadConfig();
let slotCategory = null; // Variable globale pour stocker l'ID de la catégorie de slot

// Définitions des variables globales pour suivre les tâches de slot et les canaux
const slotTasks = {};
const slotChannels = {};
const commandUsage = {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", async () => {
  console.clear();
  console.log(
    `Slot Bot by @Sparkle | kda_delta (discord) | https://github.com/KDA-sparkle | Open source | in as ${client.user.tag}\nPrefix: ${prefix}\nOwner: ${owner}\n`
  );
});

client.on("error", (error) => {
  console.error("An error occurred:", error);
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === "help") {
    const embed = new EmbedBuilder()
      .setTitle("Slot Bot Help")
      .setDescription("Commands for the Slot Bot")
      .setColor(0x3498db)
      .addFields(
        {
          name: `${prefix}setslot <user> <duration>`,
          value:
            "Set a slot for a user. Duration can be 'w' for weeks, 'm' for months, or 'lifetime' for an infinite duration.",
        },
        {
          name: `${prefix}addtime <user> <duration>`,
          value:
            "Add time to a user's slot. Duration can be 'w' for weeks, 'm' for months, or 'min' for minutes.",
        },
        { name: `${prefix}hold <user>`, value: "Put a user's slot on hold." },
        {
          name: `${prefix}unhold <user>`,
          value: "Release a user's slot from hold.",
        },
        {
          name: `${prefix}stop <user>`,
          value: "Stop a user's slot and block the associated channel.",
        },
        {
          name: `${prefix}revoke <user> <reason>`,
          value:
            "Revoke a user's slot for a specified reason and delete the channel.",
        },
        {
          name: `${prefix}everyone`,
          value: "Mention @everyone (limited to once per day per user).",
        },
        {
          name: `${prefix}here`,
          value: "Mention @here (limited to once per day per user).",
        },
        {
          name: `${prefix}active_slots`,
          value: "List all active slots and their expiration times.",
        },
        {
          name: `${prefix}setcategory <category_id>`,
          value: "Set the category for slot channels.",
        }
      );
    await message.channel.send({ embeds: [embed] });
    return;
  }

  // Fonction pour vérifier si l'utilisateur est propriétaire ou administrateur
  function isOwnerOrAdmin(member) {
    return (
      owner.includes(member.id) ||
      member.permissions.has(PermissionsBitField.Flags.Administrator)
    );
  }

  if (command === "setcategory") {
    if (!isOwnerOrAdmin(message.member)) {
      message.channel.send("You do not have permission to use this command.");
      return;
    }

    const categoryId = args[0];
    const category = message.guild.channels.cache.get(categoryId);

    if (!category || category.type !== ChannelType.GuildCategory) {
      message.channel.send("Invalid category ID.");
      return;
    }

    slotCategory = categoryId;
    message.channel.send(`Slot category set to ${category.name}`);
    return;
  }

  if (command === "setslot") {
    console.log("setslot command invoked");

    const user = message.mentions.members.first();
    const duration = args[1];
    console.log("User:", user);
    console.log("Duration:", duration);

    if (!isOwnerOrAdmin(message.member)) {
      console.log("Author not owner or admin");
      return;
    }

    if (!slotCategory) {
      message.channel.send(
        "Slot category not set. Use the setcategory command to set it."
      );
      return;
    }

    let seconds;
    let slotName;

    if (duration.endsWith("w")) {
      seconds = parseInt(duration.slice(0, -1)) * 7 * 24 * 60 * 60;
      slotName = `${user.user.username}-week-slot`;
    } else if (duration.endsWith("m")) {
      seconds = parseInt(duration.slice(0, -1)) * 30 * 24 * 60 * 60;
      slotName = `${user.user.username}-month-slot`;
    } else if (duration === "lifetime") {
      seconds = null;
      slotName = `${user.user.username}-lifetime-slot`;
    } else {
      message.channel.send(
        "`Invalid duration. Use 'w' for weeks, 'm' for months and 'lifetime' for infinite duration.`"
      );
      return;
    }

    const category = message.guild.channels.cache.get(slotCategory);
    console.log("Category:", category);

    if (!category) {
      message.channel.send(`\`Category with ID '${slotCategory}' not found.\``);
      return;
    }

    try {
      const channel = await message.guild.channels.create({
        name: slotName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionsBitField.Flags.SendMessages],
          },
          {
            id: user.id,
            allow: [PermissionsBitField.Flags.SendMessages],
            deny: [PermissionsBitField.Flags.MentionEveryone],
          },
        ],
      });

      console.log("Channel created:", channel);

      await channel.send(
        `${user}\n\n\`- You can't resell your slot\`\n\`- Scam = ban\`\n\`- 1 here and 1 everyone per day\`\n\`- Promote your server link is not authorized\``
      );

      if (seconds !== null) {
        const task = setTimeout(async () => {
          await channel.permissionOverwrites.edit(user.id, {
            SEND_MESSAGES: false,
          });
          await channel.send(
            `## ${user}, your slot has ended, open a ticket to continue or stop`
          );
        }, seconds * 1000);
        slotTasks[user.id] = task;
      }
      slotChannels[user.id] = channel.id;
    } catch (error) {
      console.error("Error creating channel:", error);
      message.channel.send(
        "An error occurred while creating the slot channel."
      );
    }
  }

  if (command === "addtime") {
    const user = message.mentions.members.first();
    const duration = args[1];

    if (!isOwnerOrAdmin(message.member)) return;

    let seconds;
    if (duration.endsWith("w")) {
      seconds = parseInt(duration.slice(0, -1)) * 7 * 24 * 60 * 60;
    } else if (duration.endsWith("m")) {
      seconds = parseInt(duration.slice(0, -1)) * 30 * 24 * 60 * 60;
    } else if (duration.endsWith("min")) {
      seconds = parseInt(duration.slice(0, -3)) * 60;
    } else {
      message.channel.send(
        "Invalid duration. Use 'w' for weeks, 'm' for months, and 'min' for minutes."
      );
      return;
    }

    if (user.id in slotTasks) {
      const task = slotTasks[user.id];
      if (task) clearTimeout(task);

      const channel = message.guild.channels.cache.get(slotChannels[user.id]);
      if (!channel) {
        message.channel.send("Slot channel not found.");
        return;
      }

      await channel.permissionOverwrites.edit(user.id, {
        SendMessages: true,
      });

      const newTask = setTimeout(async () => {
        await channel.permissionOverwrites.edit(user.id, {
          SendMessages: false,
        });
        await channel.send(
          `## ${user}, your slot has ended, open a ticket to continue or stop`
        );
      }, seconds * 1000);
      slotTasks[user.id] = newTask;

      message.channel.send(`${user}'s slot has been extended by ${duration}.`);
    } else {
      message.channel.send(`${user} does not have a slot.`);
    }
  }

  if (command === "hold") {
    const user = message.mentions.members.first();

    if (!isOwnerOrAdmin(message.member)) return;

    if (user && slotChannels[user.id]) {
      const channel = message.guild.channels.cache.get(slotChannels[user.id]);
      if (!channel) {
        message.channel.send("Slot channel not found.");
        return;
      }

      await channel.permissionOverwrites.edit(user.id, {
        SendMessages: false,
      });

      const embed = new EmbedBuilder()
        .setTitle("Slot On Hold")
        .setDescription(`${user}'s slot has been put on hold.`)
        .setColor(0xe74c3c);
      await message.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(`${user} does not have a slot.`)
        .setColor(0xe74c3c);
      await message.channel.send({ embeds: [embed] });
    }
  }

  if (command === "unhold") {
    const user = message.mentions.members.first();

    if (!isOwnerOrAdmin(message.member)) return;

    if (user && slotChannels[user.id]) {
      const channel = message.guild.channels.cache.get(slotChannels[user.id]);
      if (!channel) {
        message.channel.send("Slot channel not found.");
        return;
      }

      await channel.permissionOverwrites.edit(user.id, {
        SendMessages: true,
      });

      const embed = new EmbedBuilder()
        .setTitle("Slot Unhold")
        .setDescription(`${user}'s slot has been released from hold.`)
        .setColor(0x2ecc71);
      await message.channel.send({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(`${user} does not have a slot.`)
        .setColor(0xe74c3c);
      await message.channel.send({ embeds: [embed] });
    }
  }

  if (command === "stop") {
    const user = message.mentions.members.first();

    if (!isOwnerOrAdmin(message.member)) return;

    if (user && slotChannels[user.id]) {
      const channel = message.guild.channels.cache.get(slotChannels[user.id]);
      if (!channel) {
        message.channel.send("Slot channel not found.");
        return;
      }

      await channel.permissionOverwrites.edit(user.id, {
        SendMessages: false,
      });

      clearTimeout(slotTasks[user.id]);
      delete slotTasks[user.id];

      message.channel.send(`${user}'s slot has been blocked.`);
    } else {
      message.channel.send(`${user} does not have a slot.`);
    }
  }

  if (command === "revoke") {
    const user = message.mentions.members.first();
    const reason = args.slice(1).join(" ");

    if (!isOwnerOrAdmin(message.member)) return;

    if (user && slotChannels[user.id]) {
      const channel = message.guild.channels.cache.get(slotChannels[user.id]);
      if (!channel) {
        message.channel.send("Slot channel not found.");
        return;
      }

      await channel.delete();

      clearTimeout(slotTasks[user.id]);
      delete slotTasks[user.id];
      delete slotChannels[user.id];

      const embed = new EmbedBuilder()
        .setTitle("Slot Revoked")
        .setDescription(
          `${user}'s slot has been revoked for the following reason:\n\n${reason}`
        )
        .setColor(0xe74c3c);
      await message.channel.send({ embeds: [embed] });

      try {
        await user.send(
          `Your slot has been revoked for the following reason: ${reason}`
        );
      } catch (err) {
        console.error(`Could not send DM to ${user.tag}:`, err);
      }
    } else {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription(`${user} does not have a slot.`)
        .setColor(0xe74c3c);
      await message.channel.send({ embeds: [embed] });
    }
  }

  if (command === "everyone") {
    const today = new Date().toISOString().split("T")[0];
    const usageKey = `${message.author.id}-${today}-everyone`;

    if (!slotChannels[message.author.id]) return;

    if (!commandUsage[usageKey]) {
      commandUsage[usageKey] = 0;
    }

    if (commandUsage[usageKey] >= 1) {
      message.channel.send("You have already used your everyone for today.");
      return;
    }

    commandUsage[usageKey]++;
    await message.channel.send("@everyone");
  }

  if (command === "here") {
    const today = new Date().toISOString().split("T")[0];
    const usageKey = `${message.author.id}-${today}-here`;

    if (!slotChannels[message.author.id]) return;

    if (!commandUsage[usageKey]) {
      commandUsage[usageKey] = 0;
    }

    if (commandUsage[usageKey] >= 1) {
      message.channel.send("You have already used your here for today.");
      return;
    }

    commandUsage[usageKey]++;
    await message.channel.send("@here");
  }

  if (command === "active_slots") {
    if (!isOwnerOrAdmin(message.member)) return;

    const embed = new EmbedBuilder()
      .setTitle("Active Slots")
      .setDescription("List of users with active slots")
      .setColor(0x3498db);

    for (const userId in slotTasks) {
      const user = await client.users.fetch(userId);
      const channel = message.guild.channels.cache.get(slotChannels[userId]);
      if (!channel) continue; // Skip if the channel doesn't exist

      const expirationTime = new Date(
        Date.now() + slotTasks[userId]._idleTimeout
      ).toISOString();

      embed.addFields({
        name: channel.name,
        value: `${user} | Expires at: ${expirationTime}`,
        inline: false,
      });
    }

    await message.channel.send({ embeds: [embed] });
  }
});

client.login(token).catch(console.error);
