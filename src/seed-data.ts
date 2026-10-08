import type { AlbumRating, Edition, Listing, PriceHistoryPoint } from "./types.ts";

export const editions: Edition[] = [
  {
    id: "edition-1", artist: "김광석", title: "다시 부르기 II", format: "LP", year: 2014,
    country: "대한민국", label: "With33 Music", catalogNumber: "W33-006", barcode: "8809373226688", cover: "/assets/다시부르기.jpg"
  },
  {
    id: "edition-2", artist: "The Beatles", title: "Abbey Road", format: "LP", year: 2019,
    country: "EU", label: "Apple Records", catalogNumber: "0602508007445", barcode: "0602508007445", cover: "/assets/abbey_road.jpg"
  },
  {
    id: "edition-3", artist: "백예린", title: "Every letter I sent you.", format: "CD", year: 2020,
    country: "대한민국", label: "Blue Vinyl", catalogNumber: "BGCD0113", barcode: "8809696001139", cover: "/assets/Every_letter_I_sent_you.jpeg"
  },
  {
    id: "edition-4", artist: "Miles Davis", title: "Kind of Blue", format: "LP", year: 2021,
    country: "US", label: "Columbia", catalogNumber: "19439802171", barcode: "194398021718", cover: "/assets/kind_of_blue.jpg"
  },
  {
    id: "edition-5", artist: "Radiohead", title: "OK Computer", format: "LP", year: 1997,
    country: "UK", label: "Parlophone", catalogNumber: "NODATA 02", barcode: "724385522919", cover: "/assets/ok_computer.jpg"
  },
  {
    id: "edition-6", artist: "Nirvana", title: "Nevermind", format: "LP", year: 1991,
    country: "US", label: "DGC", catalogNumber: "DGC-24425", barcode: "720642442517", cover: "/assets/nevermind.jpg"
  },
  {
    id: "edition-7", artist: "Daft Punk", title: "Random Access Memories", format: "LP", year: 2013,
    country: "EU", label: "Columbia", catalogNumber: "88883716861", barcode: "888837168618", cover: "/assets/random_access_memory.jpg"
  },
  {
    id: "edition-8", artist: "Kendrick Lamar", title: "To Pimp a Butterfly", format: "LP", year: 2015,
    country: "US", label: "Top Dawg", catalogNumber: "B0023464-01", barcode: "602547311009", cover: "/assets/To_Pimp_A_Butterfly.jpg"
  },
  {
    id: "edition-9", artist: "아이유", title: "Palette", format: "CD", year: 2017,
    country: "대한민국", label: "FAVE", catalogNumber: "L100005290", barcode: "8804775080566", cover: "/assets/palette.jpg"
  },
  {
    id: "edition-10", artist: "The Strokes", title: "Is This It", format: "LP", year: 2001,
    country: "US", label: "RCA", catalogNumber: "07863 68045-1", barcode: "078636804512", cover: "/assets/Is_this_it.jpg"
  }
];

export const listings: Listing[] = [
  {
    id: "listing-101", editionId: "edition-1", sellerName: "needle_drop", price: 78000, shippingFee: 3500,
    mediaCondition: "최상", packageCondition: "양호", sealed: false, components: ["LP", "가사지", "아웃슬리브"],
    defects: "커버 우측 하단에 아주 옅은 눌림이 있습니다.", photos: ["/assets/다시부르기.jpg", "/assets/다시부르기.jpg", "/assets/다시부르기.jpg"],
    status: "ACTIVE", createdAt: "2026-08-20T11:20:00.000Z"
  },
  {
    id: "listing-102", editionId: "edition-2", sellerName: "analog_seoul", price: 42900, shippingFee: 3000,
    mediaCondition: "양호", packageCondition: "사용감 있음", sealed: false, components: ["LP", "이너슬리브"],
    defects: "게이트폴드 모서리에 보관 흔적이 있습니다. 재생은 양호합니다.", photos: ["/assets/abbey_road.jpg", "/assets/abbey_road.jpg", "/assets/abbey_road.jpg"],
    status: "ACTIVE", createdAt: "2026-08-19T08:00:00.000Z"
  },
  {
    id: "listing-103", editionId: "edition-3", sellerName: "blue_room", price: 115000, shippingFee: 3500,
    mediaCondition: "미확인", packageCondition: "최상", sealed: true, components: ["CD", "북클릿", "미개봉 구성품"],
    defects: "미개봉이며 외부 비닐에 미세한 보관 흔적만 있습니다.", photos: ["/assets/Every_letter_I_sent_you.jpeg", "/assets/Every_letter_I_sent_you.jpeg", "/assets/Every_letter_I_sent_you.jpeg"],
    status: "ACTIVE", createdAt: "2026-08-21T02:30:00.000Z"
  },
  {
    id: "listing-104", editionId: "edition-4", sellerName: "mono_club", price: 38900, shippingFee: 3000,
    mediaCondition: "최상", packageCondition: "최상", sealed: false, components: ["LP", "이너슬리브"],
    defects: "하자 없이 깨끗합니다. 2회 재생했습니다.", photos: ["/assets/kind_of_blue.jpg", "/assets/kind_of_blue.jpg", "/assets/kind_of_blue.jpg"],
    status: "ACTIVE", createdAt: "2026-08-18T15:45:00.000Z"
  },
  {
    id: "listing-105", editionId: "edition-2", sellerName: "record_life", price: 36000, shippingFee: 3000,
    mediaCondition: "양호", packageCondition: "양호", sealed: false, components: ["LP"], defects: "거래 진행 중인 상품입니다.",
    photos: ["/assets/abbey_road.jpg", "/assets/abbey_road.jpg", "/assets/abbey_road.jpg"], status: "IN_TRANSACTION", createdAt: "2026-08-21T00:00:00.000Z"
  },
  {
    id: "listing-106", editionId: "edition-5", sellerName: "paper_sleeve", price: 52000, shippingFee: 3500,
    mediaCondition: "양호", packageCondition: "양호", sealed: false, components: ["LP", "이너슬리브"],
    defects: "커버에 가벼운 보관 흔적이 있습니다.", photos: ["/assets/ok_computer.jpg"], status: "ACTIVE", createdAt: "2026-08-17T09:00:00.000Z"
  },
  {
    id: "listing-107", editionId: "edition-6", sellerName: "feedback_room", price: 46000, shippingFee: 3500,
    mediaCondition: "최상", packageCondition: "양호", sealed: false, components: ["LP", "이너슬리브"],
    defects: "하자 없이 깨끗합니다.", photos: ["/assets/nevermind.jpg"], status: "ACTIVE", createdAt: "2026-09-01T09:00:00.000Z"
  },
  {
    id: "listing-108", editionId: "edition-7", sellerName: "robot_rock", price: 61000, shippingFee: 3500,
    mediaCondition: "최상", packageCondition: "최상", sealed: false, components: ["LP", "게이트폴드"],
    defects: "재생 및 패키지 상태가 좋습니다.", photos: ["/assets/random_access_memory.jpg"], status: "ACTIVE", createdAt: "2026-09-02T09:00:00.000Z"
  },
  {
    id: "listing-109", editionId: "edition-8", sellerName: "groove_archive", price: 57000, shippingFee: 3500,
    mediaCondition: "양호", packageCondition: "최상", sealed: false, components: ["2LP", "북클릿"],
    defects: "디스크에 재생 영향 없는 미세 흔적이 있습니다.", photos: ["/assets/To_Pimp_A_Butterfly.jpg"], status: "ACTIVE", createdAt: "2026-09-03T09:00:00.000Z"
  },
  {
    id: "listing-110", editionId: "edition-9", sellerName: "violet_room", price: 28500, shippingFee: 3000,
    mediaCondition: "최상", packageCondition: "최상", sealed: false, components: ["CD", "포토북"],
    defects: "구성품 모두 포함되어 있습니다.", photos: ["/assets/palette.jpg"], status: "ACTIVE", createdAt: "2026-09-04T09:00:00.000Z"
  },
  {
    id: "listing-111", editionId: "edition-10", sellerName: "modern_age", price: 49000, shippingFee: 3500,
    mediaCondition: "최상", packageCondition: "양호", sealed: false, components: ["LP", "이너슬리브"],
    defects: "커버 모서리에 미세한 눌림이 있습니다.", photos: ["/assets/Is_this_it.jpg"], status: "ACTIVE", createdAt: "2026-09-05T09:00:00.000Z"
  }
];

export const priceHistory: PriceHistoryPoint[] = [
  { id: "trade-101", editionId: "edition-1", price: 69000, tradedAt: "2026-03-08T03:20:00.000Z" },
  { id: "trade-102", editionId: "edition-1", price: 72000, tradedAt: "2026-04-11T09:10:00.000Z" },
  { id: "trade-103", editionId: "edition-1", price: 68000, tradedAt: "2026-05-18T06:40:00.000Z" },
  { id: "trade-104", editionId: "edition-1", price: 75000, tradedAt: "2026-06-22T12:00:00.000Z" },
  { id: "trade-105", editionId: "edition-1", price: 77000, tradedAt: "2026-07-14T04:30:00.000Z" },
  { id: "trade-106", editionId: "edition-1", price: 76000, tradedAt: "2026-08-19T10:15:00.000Z" },
  { id: "trade-201", editionId: "edition-2", price: 39500, tradedAt: "2026-03-15T08:00:00.000Z" },
  { id: "trade-202", editionId: "edition-2", price: 41000, tradedAt: "2026-04-09T02:35:00.000Z" },
  { id: "trade-203", editionId: "edition-2", price: 38000, tradedAt: "2026-05-27T13:20:00.000Z" },
  { id: "trade-204", editionId: "edition-2", price: 42000, tradedAt: "2026-06-16T07:50:00.000Z" },
  { id: "trade-205", editionId: "edition-2", price: 40500, tradedAt: "2026-07-25T11:10:00.000Z" },
  { id: "trade-206", editionId: "edition-2", price: 43000, tradedAt: "2026-08-17T05:45:00.000Z" },
  { id: "trade-301", editionId: "edition-3", price: 98000, tradedAt: "2026-03-04T01:15:00.000Z" },
  { id: "trade-302", editionId: "edition-3", price: 104000, tradedAt: "2026-04-20T10:40:00.000Z" },
  { id: "trade-303", editionId: "edition-3", price: 101000, tradedAt: "2026-05-12T08:25:00.000Z" },
  { id: "trade-304", editionId: "edition-3", price: 108000, tradedAt: "2026-06-28T04:10:00.000Z" },
  { id: "trade-305", editionId: "edition-3", price: 112000, tradedAt: "2026-07-19T12:30:00.000Z" },
  { id: "trade-306", editionId: "edition-3", price: 110000, tradedAt: "2026-08-23T06:55:00.000Z" },
  { id: "trade-401", editionId: "edition-4", price: 35000, tradedAt: "2026-03-19T03:30:00.000Z" },
  { id: "trade-402", editionId: "edition-4", price: 36500, tradedAt: "2026-04-24T09:05:00.000Z" },
  { id: "trade-403", editionId: "edition-4", price: 34000, tradedAt: "2026-05-08T11:45:00.000Z" },
  { id: "trade-404", editionId: "edition-4", price: 38000, tradedAt: "2026-06-14T02:20:00.000Z" },
  { id: "trade-405", editionId: "edition-4", price: 37500, tradedAt: "2026-07-21T07:35:00.000Z" },
  { id: "trade-406", editionId: "edition-4", price: 39000, tradedAt: "2026-08-26T13:10:00.000Z" }
];

export const ratings: AlbumRating[] = [
  { id: "rating-101", editionId: "edition-1", userId: "archive-1", score: 5, createdAt: "2026-05-03T04:00:00.000Z", updatedAt: "2026-05-03T04:00:00.000Z" },
  { id: "rating-102", editionId: "edition-1", userId: "archive-2", score: 4, createdAt: "2026-05-19T07:30:00.000Z", updatedAt: "2026-05-19T07:30:00.000Z" },
  { id: "rating-103", editionId: "edition-1", userId: "archive-3", score: 5, createdAt: "2026-06-11T10:20:00.000Z", updatedAt: "2026-06-11T10:20:00.000Z" },
  { id: "rating-104", editionId: "edition-1", userId: "archive-4", score: 4, createdAt: "2026-08-02T03:10:00.000Z", updatedAt: "2026-08-02T03:10:00.000Z" },
  { id: "rating-201", editionId: "edition-2", userId: "archive-1", score: 4, createdAt: "2026-04-14T02:00:00.000Z", updatedAt: "2026-04-14T02:00:00.000Z" },
  { id: "rating-202", editionId: "edition-2", userId: "archive-2", score: 4, createdAt: "2026-05-09T09:40:00.000Z", updatedAt: "2026-05-09T09:40:00.000Z" },
  { id: "rating-203", editionId: "edition-2", userId: "archive-3", score: 5, createdAt: "2026-06-27T05:20:00.000Z", updatedAt: "2026-06-27T05:20:00.000Z" },
  { id: "rating-204", editionId: "edition-2", userId: "archive-4", score: 3, createdAt: "2026-08-18T11:00:00.000Z", updatedAt: "2026-08-18T11:00:00.000Z" },
  { id: "rating-301", editionId: "edition-3", userId: "archive-1", score: 5, createdAt: "2026-03-21T01:15:00.000Z", updatedAt: "2026-03-21T01:15:00.000Z" },
  { id: "rating-302", editionId: "edition-3", userId: "archive-2", score: 5, createdAt: "2026-04-29T08:35:00.000Z", updatedAt: "2026-04-29T08:35:00.000Z" },
  { id: "rating-303", editionId: "edition-3", userId: "archive-3", score: 4, createdAt: "2026-07-07T12:25:00.000Z", updatedAt: "2026-07-07T12:25:00.000Z" },
  { id: "rating-304", editionId: "edition-3", userId: "archive-4", score: 5, createdAt: "2026-08-22T06:45:00.000Z", updatedAt: "2026-08-22T06:45:00.000Z" },
  { id: "rating-401", editionId: "edition-4", userId: "archive-1", score: 5, createdAt: "2026-04-04T03:05:00.000Z", updatedAt: "2026-04-04T03:05:00.000Z" },
  { id: "rating-402", editionId: "edition-4", userId: "archive-2", score: 4, createdAt: "2026-05-16T07:55:00.000Z", updatedAt: "2026-05-16T07:55:00.000Z" },
  { id: "rating-403", editionId: "edition-4", userId: "archive-3", score: 4, createdAt: "2026-06-30T10:40:00.000Z", updatedAt: "2026-06-30T10:40:00.000Z" },
  { id: "rating-404", editionId: "edition-4", userId: "archive-4", score: 5, createdAt: "2026-08-25T04:25:00.000Z", updatedAt: "2026-08-25T04:25:00.000Z" },
  { id: "rating-501", editionId: "edition-5", userId: "archive-1", score: 5, createdAt: "2026-04-12T03:05:00.000Z", updatedAt: "2026-04-12T03:05:00.000Z" },
  { id: "rating-502", editionId: "edition-5", userId: "archive-2", score: 4, createdAt: "2026-05-22T07:55:00.000Z", updatedAt: "2026-05-22T07:55:00.000Z" },
  { id: "rating-503", editionId: "edition-5", userId: "archive-3", score: 4, createdAt: "2026-07-02T10:40:00.000Z", updatedAt: "2026-07-02T10:40:00.000Z" }
];
