"use strict";

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Try to find users by email to get stable IDs regardless of insertion order
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM "Users" WHERE email IN ('alice@example.com','bob@example.com','carol@example.com')`,
    );

    const emailToId = (users || []).reduce((acc, u) => {
      acc[u.email] = u.id;
      return acc;
    }, {});

    const messages = [
      {
        message: "Hey Bob, how are you?",
        senderId: emailToId["alice@example.com"] || 1,
        receiverId: emailToId["bob@example.com"] || 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        message: "Hi Alice! I'm fine — thanks!",
        senderId: emailToId["bob@example.com"] || 2,
        receiverId: emailToId["alice@example.com"] || 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        message: "Welcome Carol!",
        senderId: emailToId["alice@example.com"] || 1,
        receiverId: emailToId["carol@example.com"] || 3,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("Messages", messages, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Messages", null, {});
  },
};
("use strict");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Try to find users by email to get stable IDs regardless of insertion order
    const [users] = await queryInterface.sequelize.query(
      `SELECT id, email FROM "Users" WHERE email IN ('alice@example.com','bob@example.com','carol@example.com')`,
    );

    const emailToId = (users || []).reduce((acc, u) => {
      acc[u.email] = u.id;
      return acc;
    }, {});

    const messages = [
      {
        message: "Hey Bob, how are you?",
        senderId: emailToId["alice@example.com"] || 1,
        receiverId: emailToId["bob@example.com"] || 2,
        createdAt: now,
        updatedAt: now,
      },
      {
        message: "Hi Alice! I'm fine — thanks!",
        senderId: emailToId["bob@example.com"] || 2,
        receiverId: emailToId["alice@example.com"] || 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        message: "Welcome Carol!",
        senderId: emailToId["alice@example.com"] || 1,
        receiverId: emailToId["carol@example.com"] || 3,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("Messages", messages, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Messages", null, {});
  },
};
