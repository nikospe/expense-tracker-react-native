# 📊 Business Expense & Tax Tracker (React Native)

A professional, privacy-focused financial management mobile application designed for service-based companies and freelancers. This tool simplifies bookkeeping by calculating net profit, taxes, and tax prepayments in real-time.

## ✨ Key Features

*   **Interactive Dashboard:** Monthly overview with smooth drag-to-navigate functionality between months.
*   **Smart Tax Logic:** Automatically calculates Net Profit, Income Tax, and Tax Prepayment (Prokatavoli Forou) based on customizable regional rates.
*   **Expense Management:** Pre-defined expense categories with the ability for users to add custom ones.
*   **Privacy First:** Built with **SQLite** for local storage. All sensitive financial data remains on the user's device—no external servers or cloud tracking.
*   **Data Portability:** Robust **Export/Import** system allowing users to backup their data to a file or migrate it to a new device.
*   **Advanced Settings:** 
    *   **Multi-language Support:** Fully localized using **i18next**.
    *   **Custom Themes:** Dynamic Dark and Light mode support.
    *   **Financial Configuration:** Set default revenue/expense values and toggle tax prepayment calculations.

## 🛠 Tech Stack

*   **Framework:** React Native (Cross-platform iOS/Android)
*   **Database:** SQLite (Local Persistence)
*   **Localization:** i18next (Internationalization)
*   **State Management:** [Πρόσθεσε εδώ π.χ. Redux ή Context API]
*   **UI/UX:** Custom Animated Transitions & Theme Engine

## 📸 App Showcase

### 1. Dashboard (Main Overview)
<table>
  <tr>
    <td><p align="center"><b>Dashboard View 1</b></p> <img width="603" height="1311" alt="IMG_0820" src="https://github.com/user-attachments/assets/92deb4ae-8c2d-44fb-8254-dd05947ec9c3" />
 </td>
    <td><p align="center"><b>Dashboard View 2</b></p> <img width="603" height="1311" alt="IMG_0821" src="https://github.com/user-attachments/assets/e8718d37-ced0-4431-80e9-7b969fa6f4d3" />
 </td>
  </tr>
</table>

### 2. Entries & Management
<table>
  <tr>
    <td><p align="center"><b>Revenue & Expenses</b></p> <img width="603" height="1311" alt="IMG_0817" src="https://github.com/user-attachments/assets/177a6d22-6863-465f-b601-04117e839c53" />
 </td>
  </tr>
</table>

### 3. Settings & Configuration
<table>
  <tr>
    <td><p align="center"><b>General Settings</b></p> <img width="603" height="1311" alt="IMG_0818" src="https://github.com/user-attachments/assets/dfaff946-d67e-4d16-bec3-a4c5ef2390e8" />
 </td>
    <td><p align="center"><b>Tax Configuration</b></p> <img width="603" height="1311" alt="IMG_0819" src="https://github.com/user-attachments/assets/797089d7-b1d3-4b5b-b192-2730df078d1a" />
 </td>
  </tr>
</table>

### 4. Explore & Extra Features
<table>
  <tr>
    <td><p align="center"><b>Advanced Features</b></p> <img width="603" height="1311" alt="IMG_0822" src="https://github.com/user-attachments/assets/1818ee11-5e65-4577-81ba-30c9fb75539e" />
 </td>
  </tr>
</table>

---

## 🛠 Tech Stack
*   **Framework:** React Native
*   **Database:** SQLite
*   **Localization:** i18next
*   **Theming:** Dynamic Dark/Light Mode

## 🚀 How to Run
1. `npm install`
2. `npx react-native run-android` or `npx react-native run-ios`

## 🚀 Future Roadmap
- [ ] PDF Report Generation for accounting.
- [ ] Integration with bank APIs for automatic transaction syncing.
- [ ] Cloud backup option with end-to-end encryption.
