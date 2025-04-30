// src/commands/voice.js
const { 
    SlashCommandBuilder, 
    PermissionFlagsBits,
    EmbedBuilder
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('voice')
      .setDescription('Quản lý kênh voice động')
      .addSubcommand(sub => 
        sub.setName('claim')
           .setDescription('Khóa phòng, chỉ chủ phòng có thể vào'))
      .addSubcommand(sub => 
        sub.setName('rename')
           .setDescription('Đổi tên phòng')
           .addStringOption(opt => 
             opt.setName('name')
                .setDescription('Tên mới')
                .setRequired(true)))
      .addSubcommand(sub => 
        sub.setName('transfer')
           .setDescription('Chuyển chủ phòng')
           .addUserOption(opt => 
             opt.setName('user')
                .setDescription('Người nhận')
                .setRequired(true)))
      .addSubcommand(sub => 
        sub.setName('kick')
           .setDescription('Kick người dùng khỏi voice')
           .addUserOption(opt => 
             opt.setName('user')
                .setDescription('Người bị kick')
                .setRequired(true)))
      .addSubcommand(sub => 
        sub.setName('mute')
           .setDescription('Mute người dùng trong voice (chỉ kênh này)')
           .addUserOption(opt => 
             opt.setName('user')
                .setDescription('Người bị mute')
                .setRequired(true)))
      .addSubcommand(sub => 
        sub.setName('unmute')
           .setDescription('Bỏ mute người dùng trong voice (chỉ kênh này)')
           .addUserOption(opt => 
             opt.setName('user')
                .setDescription('Người được unmute')
                .setRequired(true)))
      .addSubcommand(sub =>
        sub.setName('limit')
           .setDescription('Đặt giới hạn số người cho phòng (1-99)')
           .addIntegerOption(opt =>
             opt.setName('limit')
                .setDescription('Số người tối đa (tối đa 99)')
                .setRequired(true)
           )
      ),
  
    async execute(interaction) {
      const { client, member, guild, options } = interaction;
      const channel = member.voice.channel;
      if (!channel || !client.dynamicVoiceChannels.has(channel.id)) {
        return interaction.reply({ 
          content: 'Lệnh chỉ dùng được trong kênh động do bot tạo.', 
          ephemeral: true 
        });
      }
  
      // Xác định chủ phòng
      const ownerOverwrite = channel.permissionOverwrites.cache
        .find(o => o.id !== guild.roles.everyone.id);
      const ownerId = ownerOverwrite?.id;
      const isOwner = member.id === ownerId;
  
      const sub = options.getSubcommand();
      switch (sub) {
        case 'claim':
          if (isOwner) return interaction.reply({ content: 'Bạn đã là chủ phòng rồi.', ephemeral: true });
          await channel.permissionOverwrites.edit(guild.roles.everyone.id, { Connect: false });
          await channel.permissionOverwrites.edit(member.id, { Connect: true, ViewChannel: true });
          return interaction.reply({ content: 'Claim thành công.', ephemeral: true });
  
        case 'rename':
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới đổi tên.', ephemeral: true });
          const newName = options.getString('name');
          await channel.setName(newName);
          return interaction.reply({ content: `Đã đổi tên thành **${newName}**.`, ephemeral: true });
  
        case 'transfer': {
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới chuyển quyền.', ephemeral: true });
          const target = options.getUser('user');
          if (target.id === ownerId) return interaction.reply({ content: 'Không thể chuyển cho chính bạn.', ephemeral: true });
          await channel.permissionOverwrites.edit(ownerId, { Connect: false });
          await channel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
          return interaction.reply({ content: `Đã chuyển chủ phòng cho <@${target.id}>.`, ephemeral: true });
        }
  
        case 'kick': {
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới kick.', ephemeral: true });
          const toKick = options.getMember('user');
          if (!toKick.voice.channel || toKick.voice.channel.id !== channel.id) {
            return interaction.reply({ content: 'Người này không trong phòng của bạn.', ephemeral: true });
          }
          await toKick.voice.disconnect();
          return interaction.reply({ content: `Đã kick <@${toKick.id}>.`, ephemeral: true });
        }
  
        case 'mute': {
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới mute.', ephemeral: true });
          const toMute = options.getMember('user');
          if (!toMute.voice.channel || toMute.voice.channel.id !== channel.id) {
            return interaction.reply({ content: 'Người này không trong phòng của bạn.', ephemeral: true });
          }
          // Mute tại kênh này thông qua permission overwrite
          await channel.permissionOverwrites.edit(toMute.id, { Speak: false });
          return interaction.reply({ content: `Đã mute <@${toMute.id}> ở kênh này.`, ephemeral: true });
        }
  
        case 'unmute': {
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới unmute.', ephemeral: true });
          const toUnmute = options.getMember('user');
          if (!toUnmute.voice.channel || toUnmute.voice.channel.id !== channel.id) {
            return interaction.reply({ content: 'Người này không trong phòng của bạn.', ephemeral: true });
          }
          // Xóa overwrite cho phép speak trở lại
          await channel.permissionOverwrites.delete(toUnmute.id);
          return interaction.reply({ content: `Đã bỏ mute <@${toUnmute.id}> ở kênh này.`, ephemeral: true });
        }
  
        case 'limit':
          if (!isOwner) return interaction.reply({ content: 'Chỉ chủ phòng mới đặt giới hạn.', ephemeral: true });
          const limit = options.getInteger('limit');
          if (limit < 1 || limit > 99) {
            return interaction.reply({ content: 'Giá trị giới hạn phải trong khoảng 1–99.', ephemeral: true });
          }
          try {
            await channel.setUserLimit(limit);
            return interaction.reply({ content: `Đã đặt giới hạn thành ${limit} người.`, ephemeral: true });
          } catch (err) {
            console.error('Set limit error:', err);
            return interaction.reply({ content: 'Không thể đặt giới hạn. Vui lòng thử lại sau.', ephemeral: true });
          }
  
        default:
          return interaction.reply({ content: 'Unknown subcommand!', ephemeral: true });
      }
    }
  };
  