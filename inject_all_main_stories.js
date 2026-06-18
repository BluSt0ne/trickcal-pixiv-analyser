const fs = require('fs');
const path = require('path');

const eventsPath = 'public/events.json';
const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));

// Filter out any existing '메인스토리' type events to prevent duplication/messiness
const cleanEvents = events.filter(e => e.type !== '메인스토리');

const mainStories = [
  // ================= SEASON 1 =================
  {
    date: '2023-09-27',
    title: '메인 스토리 시즌 1 챕터 1',
    banner: 'https://i.namu.wiki/i/A17c7VJwq_Zf-j--ij-3-eJaFNzAz4amTGR2siYruQ9MncY5Od1Yepe1zwDllM8vPmY7ceQ29qQ5QH7ZosgiZI63wQkB1oyJPa3Oq8wBylroxnnqQvlNKWcHzSvgEutjrcVOmjI4xHExzC-C0Dp3Ig.webp'
  },
  {
    date: '2023-09-27',
    title: '메인 스토리 시즌 1 챕터 2',
    banner: 'https://i.namu.wiki/i/n1z2ejj-qDdUeksE0RFb7ndIEPmyDYdOjiemfSaawTOE6iWampmCJy-uqpx_my5McDjq6AAOdBSMpRFU9CW-XmAgiCAvtFnn4Yo1Z-heUlW4-MpMcNc8c5BEEzWsNx5nZg-qbVSCpwVGCGzhDkZ3AA.webp'
  },
  {
    date: '2023-09-27',
    title: '메인 스토리 시즌 1 챕터 3',
    banner: 'https://i.namu.wiki/i/aC-w32f3hTPUq1AWTO9oIM-y_ketsrz5KVFUtdjK3rdBerB-6O2ib9VnCRS67dUhQF1WL3XDj_QPlak3MwZb2U96p-TbAFxMPM0MY9oH4nZIQVgM1-dANFxTEpoHYXnusT3OV-f-yEh4pg3436Aw9A.webp'
  },
  {
    date: '2023-09-27',
    title: '메인 스토리 시즌 1 챕터 4',
    banner: 'https://i.namu.wiki/i/HzlqyFx0vRT-K7t-Mzz__82zrnf8bYcfWWCQj2gMjLmLGMDkZixS6nDhvfwkLu0zCyTAGGrcrhawdI2iQF3imyhl0EIq6pUyXhjvzu3m36cDBqrdnbgI0lmaCn8qO3bz8wr-5Vv5Zk3FDtpwbO1L2A.webp'
  },
  {
    date: '2023-10-12',
    title: '메인 스토리 시즌 1 챕터 5',
    banner: 'https://i.namu.wiki/i/qC8wSTmBlZ_I4CdrtdzqD6pyyUvfPeQGn6HtE52NQEhSUUFkJAAxnN1HvS4wdfCap_tTeFmhOZy48EeaFaMjajLjzRw9WIDBAmYfBTjwrVnh0gjWx9BnopMB2795CM2k640mfug1LhvRj3aqtaj7sQ.webp'
  },
  {
    date: '2023-11-16',
    title: '메인 스토리 시즌 1 챕터 6 전편',
    banner: 'https://i.namu.wiki/i/iD4-ZTGHVY540b1sFLBb8hUfN1RMYgdKvPAeKZ6qNXh1ZT_AfLjw4xkng3-u22IcqAYYrkiL8e0pjMqHZziheG5mu8j48n8rbCMeZRzvxgYDNEEVruAjG-oxTf03gm1LlLha0mP0pCIt0iW1FIRwLA.webp'
  },
  {
    date: '2024-01-11',
    title: '메인 스토리 시즌 1 챕터 6 중편',
    banner: 'https://i.namu.wiki/i/iD4-ZTGHVY540b1sFLBb8hUfN1RMYgdKvPAeKZ6qNXh1ZT_AfLjw4xkng3-u22IcqAYYrkiL8e0pjMqHZziheG5mu8j48n8rbCMeZRzvxgYDNEEVruAjG-oxTf03gm1LlLha0mP0pCIt0iW1FIRwLA.webp'
  },
  {
    date: '2024-02-29',
    title: '메인 스토리 시즌 1 챕터 6 후편',
    banner: 'https://i.namu.wiki/i/iD4-ZTGHVY540b1sFLBb8hUfN1RMYgdKvPAeKZ6qNXh1ZT_AfLjw4xkng3-u22IcqAYYrkiL8e0pjMqHZziheG5mu8j48n8rbCMeZRzvxgYDNEEVruAjG-oxTf03gm1LlLha0mP0pCIt0iW1FIRwLA.webp'
  },
  {
    date: '2024-04-18',
    title: '메인 스토리 시즌 1 챕터 7',
    banner: 'https://i.namu.wiki/i/0BZx-evNLsCqALdg8tDFq2tmofSio60zaYUPmsdWEg09LK0HkeCtHunWqS-oLNTB-cdxZgG_gAUD8LiiTJU0NYPM4waDAX6zUqEx9m2dt6xiHWg5uGfPUYW2qbhuFQVGm5DtnfsIvZ8EeC4YDjxIPg.webp'
  },
  {
    date: '2024-07-18',
    title: '메인 스토리 시즌 1 챕터 8',
    banner: 'https://i.namu.wiki/i/3aXz86XaBt2gymJ6YpFVozMbL1OOrCPB31lDrZWgbwtYsHWsbdqmF526ZM_hWUmUqtcS-_3l3SoDc-fXNsb5Pz_vrKZW5BDIrDF_UI6NwyDRAD2bdvPG1wcX09Dqz9DQhQ0iryZETHuOKvd_ILRrBw.webp'
  },
  {
    date: '2024-09-12',
    title: '메인 스토리 시즌 1 챕터 9',
    banner: 'https://i.namu.wiki/i/hyQuz8_JBrLY-Kq6_PAopBl46tu3qu38pYPGubIeDVs6yQqX_4_sh5TZWFwpsGc-IdxVKJvfIp4mZ_rXbyrWSup-V2CTPfKbMUW_6O_LhRiQdKZQG82xJBijFfEjElX8MfdpKni4gZOur8KJtm0UEg.webp'
  },
  
  // ================= SEASON 2 =================
  {
    date: '2024-12-19',
    title: '메인 스토리 시즌 2 챕터 1 전편',
    banner: 'https://i.namu.wiki/i/WcFgmKylcNvsRVlodLPRNKyxuUAY7lmh0itWBzPVHe_dOwuorTnoJZuvm6Gu--cSdDNLI-7Fb2xGvSF4X8DTxcjFVTme6negYPNJj3P4DaWF2rQt9CLLaxUa_xz_VUV-3zDm8oPYdxu2JJL8FbuL6A.webp'
  },
  {
    date: '2025-01-02',
    title: '메인 스토리 시즌 2 챕터 1 후편',
    banner: 'https://i.namu.wiki/i/WcFgmKylcNvsRVlodLPRNKyxuUAY7lmh0itWBzPVHe_dOwuorTnoJZuvm6Gu--cSdDNLI-7Fb2xGvSF4X8DTxcjFVTme6negYPNJj3P4DaWF2rQt9CLLaxUa_xz_VUV-3zDm8oPYdxu2JJL8FbuL6A.webp'
  },
  {
    date: '2025-02-06',
    title: '메인 스토리 시즌 2 챕터 2 전편',
    banner: 'https://i.namu.wiki/i/r2IvMlppZyZjjOqdsxXeRUWIdZxCo-RnPY8tG705tD_HqUvjcCKrq1dWLongeWU_pV7RLQ45k8Xw2TJyrt1cVCDVZ6Eh88EbKGa8d9FX9Ofdo8p73h3d4Z6bs2Z-hnhUMheXaBO7tuKZAKB8FElU3w.webp'
  },
  {
    date: '2025-02-20',
    title: '메인 스토리 시즌 2 챕터 2 후편',
    banner: 'https://i.namu.wiki/i/r2IvMlppZyZjjOqdsxXeRUWIdZxCo-RnPY8tG705tD_HqUvjcCKrq1dWLongeWU_pV7RLQ45k8Xw2TJyrt1cVCDVZ6Eh88EbKGa8d9FX9Ofdo8p73h3d4Z6bs2Z-hnhUMheXaBO7tuKZAKB8FElU3w.webp'
  },
  {
    date: '2025-03-06',
    title: '메인 스토리 시즌 2 챕터 3 전편',
    banner: 'https://i.namu.wiki/i/-MVHIVrwbkPovooy0x5Y1IMwdX0Ys9gkj2VutMk0IB31aOJ3-dGMx35vUoGPqfLsEz72QMlasb-gymDMFPZu9-2zFgDnE4em4BUV0i-JuXGKjYP6tzOM3ATUgJ9pUuPXeuo5GgV05kCw0P5GXJx7Og.webp'
  },
  {
    date: '2025-03-20',
    title: '메인 스토리 시즌 2 챕터 3 후편',
    banner: 'https://i.namu.wiki/i/-MVHIVrwbkPovooy0x5Y1IMwdX0Ys9gkj2VutMk0IB31aOJ3-dGMx35vUoGPqfLsEz72QMlasb-gymDMFPZu9-2zFgDnE4em4BUV0i-JuXGKjYP6tzOM3ATUgJ9pUuPXeuo5GgV05kCw0P5GXJx7Og.webp'
  },
  {
    date: '2025-04-05',
    title: '메인 스토리 시즌 2 챕터 4 전편',
    banner: 'https://i.namu.wiki/i/1o0A8sU3W5lbbJslu43DYraZK7DcEHg1NT3OIMxM83orCAX9QNkCx5jpHGyUMCuX462YZ_wdIcLkSPgaxdRMKF3eZRcGnghzmPHozYLOaI9U7ioO03N7Ch4dB93APa5RQ8JrqbtUnILgsPrP7vxJlQ.webp'
  },
  {
    date: '2025-04-17',
    title: '메인 스토리 시즌 2 챕터 4 후편',
    banner: 'https://i.namu.wiki/i/1o0A8sU3W5lbbJslu43DYraZK7DcEHg1NT3OIMxM83orCAX9QNkCx5jpHGyUMCuX462YZ_wdIcLkSPgaxdRMKF3eZRcGnghzmPHozYLOaI9U7ioO03N7Ch4dB93APa5RQ8JrqbtUnILgsPrP7vxJlQ.webp'
  },
  {
    date: '2025-05-01',
    title: '메인 스토리 시즌 2 챕터 5 전편',
    banner: 'https://i.namu.wiki/i/DsbL90SOZyoyWrWoPJQ219HbG-CIzUlLHjHXI27il3Wc1AIODxE4ORy_iS_ddj5m3dh9OQlTrzBt3qZLMTWja2YYvYaTPvYCOTQ4yp8xWJR_k7ol3R41l-ytGROnY_4-BdHUVW4NLakp5OFmLrpCaQ.webp'
  },
  {
    date: '2025-05-15',
    title: '메인 스토리 시즌 2 챕터 5 후편',
    banner: 'https://i.namu.wiki/i/DsbL90SOZyoyWrWoPJQ219HbG-CIzUlLHjHXI27il3Wc1AIODxE4ORy_iS_ddj5m3dh9OQlTrzBt3qZLMTWja2YYvYaTPvYCOTQ4yp8xWJR_k7ol3R41l-ytGROnY_4-BdHUVW4NLakp5OFmLrpCaQ.webp'
  },
  {
    date: '2025-05-29',
    title: '메인 스토리 시즌 2 챕터 6 전편',
    banner: 'https://i.namu.wiki/i/KuMyPB_vgY_OHn7R1vcaSVLw0jQrktEfCUsBfMku7rcqTSEZ6UvYCW8ggdSHUrmaiPv31_1naVEo9ebMiT1IH4B0LVPjAS7RvIdGhpI09sCWeu4fPe4coq3-cPNrKdn1AhXBAxnm2hLL60KysIFyUg.webp'
  },
  {
    date: '2025-06-12',
    title: '메인 스토리 시즌 2 챕터 6 후편',
    banner: 'https://i.namu.wiki/i/KuMyPB_vgY_OHn7R1vcaSVLw0jQrktEfCUsBfMku7rcqTSEZ6UvYCW8ggdSHUrmaiPv31_1naVEo9ebMiT1IH4B0LVPjAS7RvIdGhpI09sCWeu4fPe4coq3-cPNrKdn1AhXBAxnm2hLL60KysIFyUg.webp'
  },
  {
    date: '2025-07-10',
    title: '메인 스토리 시즌 2 챕터 7 전편',
    banner: 'https://i.namu.wiki/i/_ZTlwjXLzEuMR1l6KiwrTj4pldeTVi9wk9T30Xn_lXrvncVf-MeDZvWndMEHjtKyvJHs8pzGnldqKg4hwr9kA88bU29ZLUobSANj6-jH-dNC_KsdQJBq0SZh_jw1BwJG5J00foNMUfKnh9YOG1SMEg.webp'
  },
  {
    date: '2025-07-24',
    title: '메인 스토리 시즌 2 챕터 7 후편',
    banner: 'https://i.namu.wiki/i/_ZTlwjXLzEuMR1l6KiwrTj4pldeTVi9wk9T30Xn_lXrvncVf-MeDZvWndMEHjtKyvJHs8pzGnldqKg4hwr9kA88bU29ZLUobSANj6-jH-dNC_KsdQJBq0SZh_jw1BwJG5J00foNMUfKnh9YOG1SMEg.webp'
  },
  {
    date: '2025-08-21',
    title: '메인 스토리 시즌 2 챕터 8 전편',
    banner: 'https://i.namu.wiki/i/5wAFAybd3YKHIA72fOURnmabzMMOk-sgZSV8d9KoqxiQm6Y37uKKpaJNUAoprxbSK2Lsla7BLClLVytI00MwkKv8yN1UZuHTNkH2MJiFTbnUCJRkj8JkeW3YJllDYTes6I71nokS3cxZ-Jyq4FtGKg.webp'
  },
  {
    date: '2025-09-04',
    title: '메인 스토리 시즌 2 챕터 8 후편',
    banner: 'https://i.namu.wiki/i/5wAFAybd3YKHIA72fOURnmabzMMOk-sgZSV8d9KoqxiQm6Y37uKKpaJNUAoprxbSK2Lsla7BLClLVytI00MwkKv8yN1UZuHTNkH2MJiFTbnUCJRkj8JkeW3YJllDYTes6I71nokS3cxZ-Jyq4FtGKg.webp'
  },
  {
    date: '2025-10-02',
    title: '메인 스토리 시즌 2 챕터 9 전편',
    banner: 'https://i.namu.wiki/i/ckCdVDTPZpvkwWzi2JSXnqhV0riQRAk0OJ-R2S5p4Y9GWVqztjro21_MEodiWmksnI8vdH-CzqYq-Mh5LThwWl6Z_ABs4TiGPZ8CaADSWqBiBV0Vn4vDXzXT6cv8jALwGUibCS0cjHKUDpPd850l5g.webp'
  },
  {
    date: '2025-10-16',
    title: '메인 스토리 시즌 2 챕터 9 후편',
    banner: 'https://i.namu.wiki/i/ckCdVDTPZpvkwWzi2JSXnqhV0riQRAk0OJ-R2S5p4Y9GWVqztjro21_MEodiWmksnI8vdH-CzqYq-Mh5LThwWl6Z_ABs4TiGPZ8CaADSWqBiBV0Vn4vDXzXT6cv8jALwGUibCS0cjHKUDpPd850l5g.webp'
  },
  {
    date: '2025-11-13',
    title: '메인 스토리 시즌 2 보너스 챕터 전편',
    banner: 'https://i.namu.wiki/i/GUNqqPaG044-0I9dVgygbkKrToEsXhjsQwHmUzfvvD9p8SxKk59Yrhb0DutUDitDdQPCxOgbm3pkG9ihKCo7WydjHs-YFD6vyMYJD1F6WwRoq-6zpSTA8ej-ozHsrJl6a8JU7phAPkcqfkPHFiIs5w.webp'
  },
  {
    date: '2025-11-27',
    title: '메인 스토리 시즌 2 보너스 챕터 후편',
    banner: 'https://i.namu.wiki/i/GUNqqPaG044-0I9dVgygbkKrToEsXhjsQwHmUzfvvD9p8SxKk59Yrhb0DutUDitDdQPCxOgbm3pkG9ihKCo7WydjHs-YFD6vyMYJD1F6WwRoq-6zpSTA8ej-ozHsrJl6a8JU7phAPkcqfkPHFiIs5w.webp'
  },
  
  // ================= SEASON 3 =================
  {
    date: '2025-12-11',
    title: '메인 스토리 시즌 3 챕터 1 전편',
    banner: 'https://i.namu.wiki/i/3g1Q9GnhcgOuHJofb4S94T_1nxiLOPTsgupg0tGZgbphxREjSOrGhybwHsa0h-NuhBmSV5fCuORlcHxRbGfEe1HJ7hAmRN9zdG_0IxeML5-7x8XNwg3VPY6kb5ZXlfwsCEacIjwMW4r-tZ8oQ7xxHQ.webp'
  },
  {
    date: '2025-12-25',
    title: '메인 스토리 시즌 3 챕터 1 후편',
    banner: 'https://i.namu.wiki/i/3g1Q9GnhcgOuHJofb4S94T_1nxiLOPTsgupg0tGZgbphxREjSOrGhybwHsa0h-NuhBmSV5fCuORlcHxRbGfEe1HJ7hAmRN9zdG_0IxeML5-7x8XNwg3VPY6kb5ZXlfwsCEacIjwMW4r-tZ8oQ7xxHQ.webp'
  },
  {
    date: '2026-01-08',
    title: '메인 스토리 시즌 3 챕터 2 전편',
    banner: 'https://i.namu.wiki/i/eqDi_x6kpHJDYbTYYDhfT2Wp57ogzd4Z-IIYKKRfS7H8JJNdaRnbB6gwPV6GK4lx0ubp9VrqBt9AkNR4kJwfC-qilZzR3gX4vrZFUPIY2NXbF7KkoqMVA5IkRUQg7ug5t8n-XorymhDK51PSp7s2pQ.webp'
  },
  {
    date: '2026-01-22',
    title: '메인 스토리 시즌 3 챕터 2 후편',
    banner: 'https://i.namu.wiki/i/eqDi_x6kpHJDYbTYYDhfT2Wp57ogzd4Z-IIYKKRfS7H8JJNdaRnbB6gwPV6GK4lx0ubp9VrqBt9AkNR4kJwfC-qilZzR3gX4vrZFUPIY2NXbF7KkoqMVA5IkRUQg7ug5t8n-XorymhDK51PSp7s2pQ.webp'
  },
  {
    date: '2026-03-05',
    title: '메인 스토리 시즌 3 챕터 3 전편',
    banner: 'https://i.namu.wiki/i/Ck4cHufMPgiBc8SJkOmMrA4_O4d_gxW1qKzpZHUuvbTehaMyqzyYGzQiCShzUz5qCh9aFWI4ivrsFM3DUvdIqizQCRxi9xODxgx3ML6WACuM1DxT8vF9AwMd4b3KGFszOGl15oEU_V5tGjkX7pancA.webp'
  },
  {
    date: '2026-03-19',
    title: '메인 스토리 시즌 3 챕터 3 후편',
    banner: 'https://i.namu.wiki/i/Ck4cHufMPgiBc8SJkOmMrA4_O4d_gxW1qKzpZHUuvbTehaMyqzyYGzQiCShzUz5qCh9aFWI4ivrsFM3DUvdIqizQCRxi9xODxgx3ML6WACuM1DxT8vF9AwMd4b3KGFszOGl15oEU_V5tGjkX7pancA.webp'
  },
  {
    date: '2026-04-09',
    title: '메인 스토리 시즌 3 챕터 4 전편',
    banner: 'https://i.namu.wiki/i/uYxXQtFvg_YjoPv6MPOv2s1wfGo5vlzCvBbb_l0YE1sfjTe6JgPMwD08fHcwJxQa8ojLJfYWarQlgKIMR4A95fOtKCvxPWrCz-J9g5btI0o3MIfVycbgrpyfqy0zg7Atar-5thLY_kIVaa4x6v5o-g.webp'
  },
  {
    date: '2026-04-23',
    title: '메인 스토리 시즌 3 챕터 4 후편',
    banner: 'https://i.namu.wiki/i/uYxXQtFvg_YjoPv6MPOv2s1wfGo5vlzCvBbb_l0YE1sfjTe6JgPMwD08fHcwJxQa8ojLJfYWarQlgKIMR4A95fOtKCvxPWrCz-J9g5btI0o3MIfVycbgrpyfqy0zg7Atar-5thLY_kIVaa4x6v5o-g.webp'
  },
  {
    date: '2026-05-28',
    title: '메인 스토리 시즌 3 챕터 5 전편',
    banner: '/main_story_s3_ch5.png'
  },
  {
    date: '2026-06-11',
    title: '메인 스토리 시즌 3 챕터 5 후편',
    banner: '/main_story_s3_ch5.png'
  }
];

mainStories.forEach(chap => {
  cleanEvents.push({
    date: chap.date,
    type: '메인스토리',
    title: chap.title,
    server: 'KR',
    ...(chap.banner ? { banner: chap.banner } : {})
  });
});

// Sort chronologically
cleanEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

fs.writeFileSync(eventsPath, JSON.stringify(cleanEvents, null, 2));
console.log(`Successfully injected ${mainStories.length} Main Story events across Seasons 1, 2, and 3 into public/events.json!`);
