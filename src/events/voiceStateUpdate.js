const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  /**
   * @param {VoiceState} oldState 
   * @param {VoiceState} newState 
   */
  async execute(oldState, newState) {
    // chỉ xử lý khi có thay đổi channel
    if (oldState.channelId === newState.channelId) return;

    const guild = newState.guild;
    const hubs = {
      hubOn: '1363034383996682371',
      hubOff: '1363034386051895518',
      camOn: '1363034388425740339'
    };

    // helper tạo tên và đếm số
    function nextName(prefix) {
      const count = guild.channels.cache
        .filter(c => c.name.startsWith(prefix)).size;
      return `${prefix} #${count + 1}`;
    }

    // trường hợp join vào một trong 3 hub
    let createOpts;
    if (newState.channelId === hubs.hubOn) {
      // voice-mic-on: allow speak, deny stream for everyone; owner gets stream
      createOpts = {
        name: nextName('voice-mic-on'),
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.hubOn).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Speak
            ],
            deny: [
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.UseSoundboard,
              PermissionFlagsBits.UseExternalSounds
            ]
          },
          {
            id: newState.member.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream
            ]
          }
        ]
      };
    }
    else if (newState.channelId === hubs.hubOff) {
      // voice-mic-off: allow only connect/view; deny speak/stream/soundboard/external
      createOpts = {
        name: nextName('voice-mic-off'),
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.hubOff).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel
            ],
            deny: [
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream,
              PermissionFlagsBits.UseSoundboard,
              PermissionFlagsBits.UseExternalSounds
            ]
          }
        ]
      };
    }
    else if (newState.channelId === hubs.camOn) {
      // phòng-cam-on: allow connect/view/speak/stream; deny soundboard/external
      createOpts = {
        name: nextName('phòng-cam-on'),
        type: ChannelType.GuildVoice,
        parent: guild.channels.cache.get(hubs.camOn).parent,
        userLimit: 25,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.Stream
            ],
            deny: [
              PermissionFlagsBits.UseSoundboard,
              PermissionFlagsBits.UseExternalSounds
            ]
          }
        ]
      };
    }

    // nếu createOpts được thiết lập, tạo channel và move user
    if (createOpts) {
      try {
        const newCh = await guild.channels.create(createOpts);
        await newState.setChannel(newCh);
      } catch (err) {
        console.error('Tạo voice channel thất bại:', err);
      }
    }

    // tự xóa các channel động khi trống
    const oldCh = oldState.channel;
    if (
      oldCh &&
      ['voice-mic-on', 'voice-mic-off', 'phòng-cam-on']
        .some(prefix => oldCh.name.startsWith(prefix)) &&
      oldCh.members.size === 0
    ) {
      oldCh.delete().catch(console.error);
    }
  }
};
