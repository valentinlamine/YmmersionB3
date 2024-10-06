/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'google-icon': "url('src/assets/icons/google.png')",
        'user-icon' : "url('src/assets/icons/user.svg')",
        'signout-icon' : "url('src/assets/icons/SignOut.svg')",
        "paper-place-tilt-icon": "url('src/assets/icons/PaperPlaneTilt.svg')",
        "plus-icon": "url('src/assets/icons/Plus.svg')",
        "chat-icon": "url('src/assets/icons/Chat.svg')",
        "chats-icon": "url('src/assets/icons/Chats.svg')",
        "add-chat-icon": "url('src/assets/icons/AddChat.svg')",
        "user-three-icon": "url('src/assets/icons/UserThree.svg')",
        "user-plus-icon": "url('src/assets/icons/UserPlus.svg')",
        "dotsThreeVertical-icon": "url('src/assets/icons/DotsThreeVertical.svg')",
      }
    },
  },
  plugins: [],
}

