"use strict";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const users = [
      {
        name: "alice",
        email: "alice@example.com",
        password: bcrypt.hashSync("password1", 10),
        gender: "female",
        is_validated: true,
        verification_code: "",
        lastSeenAt: now,
        avatar: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "bob",
        email: "bob@example.com",
        password: bcrypt.hashSync("password2", 10),
        gender: "male",
        is_validated: true,
        verification_code: "",
        lastSeenAt: now,
        avatar: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "carol",
        email: "carol@example.com",
        password: bcrypt.hashSync("password3", 10),
        gender: "female",
        is_validated: true,
        verification_code: "",
        lastSeenAt: now,
        avatar: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert("Users", users, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("Users", null, {});
  },
};
