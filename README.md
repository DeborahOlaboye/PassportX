````markdown
# 🌍 PassportX  
**A portable, on-chain Achievement Passport built for communities, learners, and creators.  
Powered by Clarity 4 on Stacks.**

PassportX lets communities issue verifiable, user-owned achievement badges using SIP-12 NFTs and Clarity 4 typed maps. Users collect achievements across any community and showcase them in a single, beautiful passport.

---

## 🚀 Why PassportX?

Communities love recognizing their members — but achievements get stuck inside closed platforms (Discord, LMS tools, private apps). Users can’t carry their accomplishments across the web.

**PassportX fixes this.**  
Every community can issue structured, verifiable achievement badges that users permanently own.  
Users get a portable identity layer showing their growth, contribution, learning, and impact.

---

## ✨ Key Features

### 🔹 For Users
- A **portable Achievement Passport** you control  
- Beautiful visual display of badges  
- Public/private visibility control  
- A personal share link for portfolios & applications  
- Cross-community identity stitched together in one place  

### 🔹 For Communities
- Create a community with custom theme & branding  
- Issue badges with a single click  
- Badge templates for easy reuse  
- Typed metadata (level, category, date, skill)  
- Revoke or replace badges when needed  
- Zero blockchain complexity required  

### 🔹 For Developers
- Clarity 4–powered badge contracts  
- Strongly typed metadata via typed maps  
- Simple JS SDK for reading user badges  
- Public APIs that feed into dashboards or profiles  

---

## 🏗️ Architecture Overview

### **Smart Contracts (Clarity 4)**
- **SIP-12 Non-Transferable NFTs**  
  Achievements are minted as soulbound NFTs (transfers disabled).
  
- **Typed Maps for Metadata**  
  Every badge stores structured metadata:
  ```clarity
  (define-map badge-metadata 
    { id: uint }
    { level: uint, category: uint, timestamp: uint })
````

* **Traits**

  * `BadgeIssuer` — handles badge creation & minting
  * `BadgeReader` — exposes badge lookup for apps & dashboards

### **API + App**

* REST endpoints for Passport views
* Developer-facing badge lookup API
* Admin dashboard for communities
* User Passport UI with badge grid

---

## 🧑‍💼 How It Works (Product Flow)

### 1. User Creates Passport

Signs in → Gets a clean passport → Joins communities.

### 2. Community Admin Creates Badge Templates

Community → “Create Badge” → Add name, description, level, metadata, icon.

### 3. Admin Issues Badges

Select a user → Select badge → Mint.
Instantly appears in the user’s Passport.

### 4. User Shares Passport

Public passport page → Shareable link → Embeds for websites or resumes.

### 5. Developers Integrate

Use the SDK to read:

* All badges for a user
* Metadata for each badge
* Community templates

---

## 🎨 Example Badge Types

* 🌱 *Beginner Skill Badge*
* 🎉 *Event Participation Badge*
* 🛠️ *Contributor Badge*
* ⭐ *Leadership Badge*
* 🧠 *Learning Milestone Badge*

All backed by typed metadata for structure & consistency.

---

## 🧪 API & SDK (Conceptual)

### JS SDK

```js
import { getUserBadges } from "@passportx/sdk";

const badges = await getUserBadges("ST123...");
console.log(badges);
```

### Badge Metadata Output (Example)

```json
{
  "badgeId": 4,
  "name": "Python Beginner",
  "community": "Open Code Guild",
  "metadata": {
    "level": 1,
    "category": "skill",
    "timestamp": 1234567890
  }
}
```

---

## 📊 Success Metrics

* Growth in number of communities issuing badges
* Average badges per user
* Integration count (# of apps using the SDK)
* Profile views per public passport
* Admin time to create + issue badges

---

## 🛣️ Roadmap

### **Phase 1 — Core System**

* Passport UI
* SIP-12 badge minting
* Typed metadata
* Admin badge issuance

### **Phase 2 — Community Tools**

* Badge templates
* Community branding
* Permissioning model

### **Phase 3 — Developer Ecosystem**

* JS SDK
* Badge reader API
* Integration docs

### **Phase 4 — Social + Sharing**

* Public Passport
* Embeddable widgets
* Social previews

---

## 🤝 Contributing

PassportX welcomes contributions across UI, smart contracts, and documentation.
Open an issue or start a PR!

---

## 📄 License

MIT License

---

## ❤️ Acknowledgments

Built on **Stacks**
Powered by **Clarity 4**
Inspired by a vision of portable identity and community-centered recognition.

---

## 🔐 Session Management (WalletConnect)

Client-side session management utilities and a React provider are available under `src/`.

- Persist sessions across reloads using `saveSession` / `recoverSession`.
- Clear sessions with `clearSession` and `disconnect` on the provider to avoid stale sessions.
- Optional client-side encryption helpers are in `src/utils/crypto.ts`.

Usage (example):

1. Wrap your app with `WalletSessionProvider`.
2. Use `useWalletSession()` to `save` or `disconnect`.


```
