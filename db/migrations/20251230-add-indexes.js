"use strict";

module.exports = {
  async up(queryInterface) {
    // Users: add indexes to speed up lookups by name and email
    await queryInterface.addIndex("Users", ["name"], {
      name: "idx_users_name",
    });

    await queryInterface.addIndex("Users", ["email"], {
      name: "idx_users_email",
    });

    // Messages: index senderId, receiverId and composite pair
    await queryInterface.addIndex("Messages", ["senderId"], {
      name: "idx_messages_senderId",
    });

    await queryInterface.addIndex("Messages", ["receiverId"], {
      name: "idx_messages_receiverId",
    });

    await queryInterface.addIndex("Messages", ["senderId", "receiverId"], {
      name: "idx_messages_sender_receiver",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("Messages", "idx_messages_sender_receiver");
    await queryInterface.removeIndex("Messages", "idx_messages_receiverId");
    await queryInterface.removeIndex("Messages", "idx_messages_senderId");

    await queryInterface.removeIndex("Users", "idx_users_email");
    await queryInterface.removeIndex("Users", "idx_users_name");
  },
};
