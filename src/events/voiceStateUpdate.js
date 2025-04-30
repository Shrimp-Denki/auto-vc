const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(oldState, newState) {
    if (oldState.channelId === newState.channelId) return;
    const guild = newState.guild;
    const client = newState.client;

    const hubs = {
      hubOn: '1363034383996682371',
      hubOff: '1363034386051895518',
      camOn: '1363034388425740339',
      free: '1367077176721018930'
    };

    let createOpts;
    if (newState.channelId === hubs.hubOn) {
      createOpts = {
        name: `voice-mic-on #${guild.channels.cache.filter(c => c.name.startsWith('voice-mic-on')).size + 1}`,
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.hubOn).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak],
            deny: [PermissionFlagsBits.Stream, PermissionFlagsBits.UseSoundboard, PermissionFlagsBits.UseExternalSounds]
          },
          {
            id: newState.member.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream]
          }
        ]
      };
    } else if (newState.channelId === hubs.hubOff) {
      createOpts = {
        name: `voice-mic-off #${guild.channels.cache.filter(c => c.name.startsWith('voice-mic-off')).size + 1}`,
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.hubOff).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.Speak, PermissionFlagsBits.Stream, PermissionFlagsBits.UseSoundboard, PermissionFlagsBits.UseExternalSounds]
          }
        ]
      };
    } else if (newState.channelId === hubs.camOn) {
      createOpts = {
        name: `phòng-cam-on #${guild.channels.cache.filter(c => c.name.startsWith('phòng-cam-on')).size + 1}`,
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.camOn).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Speak, PermissionFlagsBits.Stream],
            deny: [PermissionFlagsBits.UseSoundboard, PermissionFlagsBits.UseExternalSounds]
          }
        ]
      };
    } else if (newState.channelId === hubs.free) {
      createOpts = {
        name: `phòng-tự-do #${guild.channels.cache.filter(c => c.name.startsWith('phòng-tự-do')).size + 1}`,
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.free).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.UseSoundboard,
              PermissionFlagsBits.UseExternalSounds
            ]
          }
        ]
      };
    }

    if (createOpts) {
      try {
        const newCh = await guild.channels.create(createOpts);
        client.dynamicVoiceChannels.add(newCh.id);
        await newState.setChannel(newCh);
      } catch (err) {
        console.error('Tạo voice channel thất bại:', err);
      }
    }

    const oldCh = oldState.channel;
    if (oldCh && client.dynamicVoiceChannels.has(oldCh.id) && oldCh.members.size === 0) {
      client.dynamicVoiceChannels.delete(oldCh.id);
      oldCh.delete().catch(console.error);
    }
  }
};
