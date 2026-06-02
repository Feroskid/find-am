// Fallback category list mirroring the product document. Used when the
// /task/categories endpoint is unavailable or returns an empty set.
import {
  Car, Home, HardHat, Laptop, Truck, Brush, HeartPulse, Scissors,
  PartyPopper, GraduationCap, Briefcase, Scale, Dog, Boxes,
  Trees, Shirt, ChefHat, PenLine, Palette,
  type LucideIcon,
} from "lucide-react";

export interface CategoryItem {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export const FALLBACK_CATEGORIES: CategoryItem[] = [
  { slug: "automotive", label: "Automotive", icon: Car },
  { slug: "home-services", label: "Home Services", icon: Home },
  { slug: "building-construction", label: "Building & Construction", icon: HardHat },
  { slug: "digital-tech", label: "Digital & Tech", icon: Laptop },
  { slug: "delivery-courier", label: "Delivery & Courier", icon: Truck },
  { slug: "cleaning", label: "Cleaning", icon: Brush },
  { slug: "health-wellness", label: "Health & Wellness", icon: HeartPulse },
  { slug: "beauty-personal-care", label: "Beauty & Personal Care", icon: Scissors },
  { slug: "events-entertainment", label: "Events & Entertainment", icon: PartyPopper },
  { slug: "education-lessons", label: "Education & Lessons", icon: GraduationCap },
  { slug: "business-admin", label: "Business & Admin", icon: Briefcase },
  { slug: "legal-finance", label: "Legal & Finance", icon: Scale },
  { slug: "pet-care", label: "Pet Care & Training", icon: Dog },
  { slug: "moving-storage", label: "Moving & Storage", icon: Boxes },
  { slug: "gardening-outdoor", label: "Gardening & Outdoor", icon: Trees },
  { slug: "fashion-alterations", label: "Fashion & Alterations", icon: Shirt },
  { slug: "food-catering", label: "Food & Catering", icon: ChefHat },
  { slug: "writing-content", label: "Writing & Content", icon: PenLine },
  { slug: "design-creative", label: "Design & Creative", icon: Palette },
];
