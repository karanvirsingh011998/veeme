/**
 * Demo content for the authenticated dashboard (prototype-aligned).
 * Swap for Supabase queries when credentials are configured.
 */

export const APP_CATEGORIES = [
  { icon: "✈️", label: "Travel" },
  { icon: "🏋️", label: "Workout" },
  { icon: "☕", label: "Food" },
  { icon: "🎟️", label: "Events" },
  { icon: "🎮", label: "Gaming" },
  { icon: "•••", label: "More" },
] as const;

export const GROUP_EXPERIENCES = [
  {
    title: "Saturday Sunrise Trek",
    icon: "🥾",
    joined: 6,
    max: 10,
    price: 799,
    host: "Rahul Sharma",
    place: "Gurugram",
    time: "Sat • 6:00 AM",
  },
  {
    title: "Sunday Cycling Ride",
    icon: "🚴",
    joined: 7,
    max: 10,
    price: 499,
    host: "Aarav",
    place: "Noida",
    time: "Sun • 6:30 AM",
  },
  {
    title: "Movie Night",
    icon: "🎬",
    joined: 5,
    max: 10,
    price: 299,
    host: "Sneha",
    place: "Gurugram",
    time: "Sat • 7:00 PM",
  },
] as const;

export const PEOPLE_CARDS = [
  { name: "Priya", role: "Travel Buddy", avatar: "👩", rating: "4.8" },
  { name: "Rahul", role: "Workout Partner", avatar: "🧔", rating: "4.9" },
  { name: "Sneha", role: "Event Companion", avatar: "👩‍🦰", rating: "4.8" },
  { name: "Aarav", role: "Fitness Partner", avatar: "🧑", rating: "4.7" },
] as const;

export const MOMENTS = [
  {
    author: "Rahul Sharma",
    title: "Saturday morning workout",
    text: "Looking for 2 people for a morning workout this Saturday. 🏋️",
    type: "Workout",
    cta: "Join Group",
    place: "Delhi",
    time: "2h ago",
  },
  {
    author: "Priya",
    title: "Coffee & conversations",
    text: "Trying a new cafe this weekend. Anyone interested? ☕",
    type: "Hangout",
    cta: "Message",
    place: "Delhi",
    time: "2h ago",
  },
  {
    author: "Sneha Verma",
    title: "Weekend trek",
    text: "Anyone up for a weekend trek? 🥾",
    type: "Travel",
    cta: "View Plan",
    place: "Delhi",
    time: "5h ago",
  },
] as const;

export const COMMUNITY_LIST = [
  { icon: "🥾", name: "Delhi Trekkers", members: "12K members" },
  { icon: "🏋️", name: "Fitness Buddies", members: "18K members" },
  { icon: "🍜", name: "Food Explorers", members: "15K members" },
  { icon: "🎮", name: "Gaming Squad", members: "9K members" },
  { icon: "🏍️", name: "Weekend Riders", members: "22K members" },
] as const;

export const CHAT_THREADS = [
  {
    avatar: "👩",
    name: "Priya",
    message: "Hey! Are you still up for the event?",
    time: "Today",
    unread: true,
    type: "people" as const,
  },
  {
    avatar: "👥",
    name: "Delhi Trekkers",
    message: "Weekend plan looks good!",
    time: "Today",
    unread: false,
    type: "groups" as const,
  },
  {
    avatar: "🧑",
    name: "Aarav",
    message: "Sure, let’s do it!",
    time: "Yesterday",
    unread: false,
    type: "people" as const,
  },
  {
    avatar: "👩‍🦰",
    name: "Sneha",
    message: "Shared a photo",
    time: "Yesterday",
    unread: true,
    type: "people" as const,
  },
] as const;

export function greetingLabel(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}