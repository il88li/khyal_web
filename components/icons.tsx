// components/icons.tsx — مجموعة أيقونات خطية (Phosphor Light style): شبكة 24px، سمك 1.5px
import type { ReactNode, SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & { size?: number | string; strokeWidth?: number | string };
export type LucideIcon = (p: IconProps) => ReactNode; // توافق مع أنواع الاستيراد القديمة
export type Icon = LucideIcon;

function mk(name: string, children: ReactNode): LucideIcon {
  const C = ({ size = 24, strokeWidth = 1.5, ...r }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...r}>{children}</svg>
  );
  C.displayName = name;
  return C;
}
const P = (d: string) => <path d={d} />;
const Ci = (cx: number, cy: number, r: number) => <circle cx={cx} cy={cy} r={r} />;

export const Plus = mk("Plus", P("M12 5v14M5 12h14"));
export const X = mk("X", P("M6 6l12 12M18 6L6 18"));
export const Check = mk("Check", P("M5 12.5l4.5 4.5L19 7.5"));
export const ChevronLeft = mk("ChevronLeft", P("M15 5l-7 7 7 7"));
export const ChevronRight = mk("ChevronRight", P("M9 5l7 7-7 7"));
export const ChevronDown = mk("ChevronDown", P("M5 9l7 7 7-7"));
export const ArrowLeft = mk("ArrowLeft", P("M20 12H4M10 6l-6 6 6 6"));
export const ArrowDown = mk("ArrowDown", P("M12 4v16M6 14l6 6 6-6"));
export const Search = mk("Search", <>{Ci(11, 11, 6.5)}{P("M16 16l4.5 4.5")}</>);
export const Heart = mk("Heart", P("M12 20s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.200a4.300 4.300 0 0 1 7.500 2.600C19.500 15.400 12 20 12 20z"));
export const Home = mk("Home", P("M4 11l8-7 8 7v8.500a.5.5 0 0 1-.5.5H15v-6H9v6H4.500a.5.5 0 0 1-.5-.5z"));
export const Compass = mk("Compass", <>{Ci(12, 12, 9)}{P("M15.500 8.500l-2 5-5 2 2-5z")}</>);
export const Bookmark = mk("Bookmark", P("M6.500 4h11v16.500L12 16.500l-5.500 4z"));
export const BookMarked = mk("BookMarked", P("M6 4h12v16H8a2 2 0 0 1-2-2zM6 18a2 2 0 0 1 2-2h10M10 4v6l2-1.500 2 1.500V4"));
export const UserRound = mk("UserRound", <>{Ci(12, 8.500, 3.500)}{P("M5 20c.8-3.600 3.700-5.500 7-5.500s6.200 1.900 7 5.500")}</>);
export const User = UserRound;
export const Users = mk("Users", <>{Ci(9, 9, 3)}{P("M3.500 19c.6-3 2.800-4.500 5.500-4.500s4.900 1.500 5.500 4.500")}{Ci(17, 9.500, 2.300)}{P("M16 14.500c2.300 0 4 1.200 4.500 3.500")}</>);
export const UserPlus = mk("UserPlus", <>{Ci(10, 8.500, 3.500)}{P("M3.500 20c.8-3.600 3.400-5.500 6.500-5.500M19 8v6M16 11h6")}</>);
export const UserX = mk("UserX", <>{Ci(10, 8.500, 3.500)}{P("M3.500 20c.8-3.600 3.400-5.500 6.500-5.500M16.500 8.500l4 4M20.500 8.500l-4 4")}</>);
export const Bell = mk("Bell", P("M5.500 18.500L7 16.500V11a5 5 0 0 1 10 0v5.500l1.500 2zM10 21h4"));
export const Settings = mk("Settings", <>{Ci(12, 12, 2.800)}{P("M10.300 4.300l.4-1.300h2.600l.4 1.300 1.500.6 1.200-.7 1.800 1.800-.7 1.200.6 1.500 1.300.4v2.600l-1.300.4-.6 1.500.7 1.200-1.800 1.800-1.200-.7-1.500.6-.4 1.300h-2.600l-.4-1.300-1.500-.6-1.200.7-1.800-1.800.7-1.200-.6-1.500L3 13.300v-2.600l1.300-.4.6-1.500-.7-1.200L6 5.800l1.200.7z")}</>);
export const SlidersHorizontal = mk("SlidersHorizontal", <>{P("M4 8h10M18 8h2M4 16h2M10 16h10")}{Ci(16, 8, 2)}{Ci(8, 16, 2)}</>);
export const ShieldCheck = mk("ShieldCheck", P("M12 3l7.500 3v5.500c0 4.500-3 7.800-7.500 9.500-4.500-1.700-7.500-5-7.500-9.500V6zM9 12l2.200 2.200L15.500 10"));
export const Lock = mk("Lock", <><rect x="5" y="10.500" width="14" height="9.500" rx="2" />{P("M8 10.500V8a4 4 0 0 1 8 0v2.500")}</>);
export const Mail = mk("Mail", <><rect x="3.500" y="5.500" width="17" height="13" rx="2" />{P("M4 7l8 6 8-6")}</>);
export const Eye = mk("Eye", <>{P("M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z")}{Ci(12, 12, 3)}</>);
export const EyeOff = mk("EyeOff", <>{P("M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z")}{Ci(12, 12, 3)}{P("M4 4l16 16")}</>);
export const Camera = mk("Camera", <>{P("M4 8.500h3l1.500-2.500h7L17 8.500h3v10H4z")}{Ci(12, 13, 3.200)}</>);
export const ImagePlus = mk("ImagePlus", P("M13 4.500H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V12M4 16l4.500-4.500L13 16M16 4v5M13.500 6.500h5"));
export const Copy = mk("Copy", <><rect x="8" y="8" width="12" height="12" rx="2" />{P("M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2")}</>);
export const FileText = mk("FileText", P("M7 3.500h7l4.500 4.500v11.500a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM14 3.500V8h4.500M9 13h6M9 16.500h6"));
export const FileWarning = mk("FileWarning", P("M7 3.500h7l4.500 4.500v11.500a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1zM14 3.500V8h4.500M12 11.500v3M12 17.500v.01"));
export const Trash2 = mk("Trash2", P("M4.500 6.500h15M9.500 6.500v-2h5v2M6.500 6.500l.8 13h9.400l.8-13M10 10.500v5.500M14 10.500v5.500"));
export const Send = mk("Send", P("M20.500 3.500l-17 7 6.500 2.500 2.500 6.500zM10 13l5-5"));
export const Share2 = mk("Share2", <>{Ci(6, 12, 2.500)}{Ci(18, 6, 2.500)}{Ci(18, 18, 2.500)}{P("M8.200 10.800l7.600-3.600M8.200 13.200l7.600 3.600")}</>);
export const Share = Share2;
export const Star = mk("Star", P("M12 3.800l2.600 5.300 5.800.8-4.200 4.100 1 5.800-5.200-2.700-5.200 2.700 1-5.800-4.200-4.100 5.800-.8z"));
export const Sparkles = mk("Sparkles", P("M10 4l1.600 4.400L16 10l-4.400 1.600L10 16l-1.600-4.400L4 10l4.400-1.600zM18 15l.8 2.200L21 18l-2.200.8L18 21l-.8-2.200L15 18l2.200-.8z"));
export const WandSparkles = Sparkles;
export const Flame = mk("Flame", P("M12 3c1 3.500 5.500 5.500 5.500 10.500a5.500 5.500 0 0 1-11 0c0-2 1-3.500 2.300-4.800.2 1.500.9 2.300 1.700 2.800C10.200 9 10.600 5.800 12 3z"));
export const Trophy = mk("Trophy", P("M8 4.500h8v5a4 4 0 0 1-8 0zM8 6.500H4.500V8A3 3 0 0 0 8 11M16 6.500h3.500V8A3 3 0 0 1 16 11M12 13.500V17M8.500 20h7M9.500 17h5"));
export const Award = mk("Award", <>{Ci(12, 9.500, 5.500)}{P("M8.800 14l-1.300 6.500L12 18l4.500 2.500L15.200 14")}</>);
export const Target = mk("Target", <>{Ci(12, 12, 9)}{Ci(12, 12, 5)}{Ci(12, 12, 1)}</>);
export const Rocket = mk("Rocket", P("M14.500 4.500c3-1 5 0 5 0s1 2 0 5l-5 5-5-5zM9.500 9.500L6 10l-2 3 3.500.5M14.500 14.500L14 18l-3 2-.5-3.500M7 17c-1 .5-2 1.500-2.500 3 1.500-.5 2.500-1.500 3-2.500"));
export const Database = mk("Database", <><ellipse cx="12" cy="6" rx="7" ry="2.500" />{P("M5 6v12c0 1.400 3.100 2.500 7 2.500s7-1.100 7-2.500V6M5 12c0 1.400 3.100 2.500 7 2.500s7-1.100 7-2.500")}</>);
export const Languages = mk("Languages", P("M4 6h9M8.500 4v2M6 6c.5 3 2.500 5.500 5.500 7M11 6c-.5 3-3 6-6.500 8M12.500 20l4-9 4 9M13.800 17.500h5.400"));
export const Palette = mk("Palette", <>{P("M12 3.500a8.500 8.500 0 1 0 0 17c1.200 0 1.800-.9 1.500-2-.4-1.300.4-2.500 1.800-2.500H17a3.500 3.500 0 0 0 3.500-3.500C20.500 7.200 16.700 3.500 12 3.500z")}{Ci(7.500, 11, .6)}{Ci(10, 7.500, .6)}{Ci(14.500, 7.500, .6)}</>);
export const History = mk("History", P("M4 12a8 8 0 1 0 2.500-5.800L4 8.500M4 4v4.500h4.500M12 8v4.500l3 1.500"));
export const Inbox = mk("Inbox", P("M4 13.500l2-8h12l2 8v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 13.500h4.500l1 2.500h5l1-2.500H20"));
export const GitFork = mk("GitFork", <>{Ci(6, 5.500, 2)}{Ci(18, 5.500, 2)}{Ci(12, 18.500, 2)}{P("M6 7.500V9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.500M12 11v5.500")}</>);
export const MessageCircle = mk("MessageCircle", P("M12 4a8 8 0 0 0-6.900 12L4 20l4.200-1.100A8 8 0 1 0 12 4z"));
export const AlertTriangle = mk("AlertTriangle", P("M12 4l9 15.500H3zM12 10v4.500M12 17v.01"));
export const Info = mk("Info", <>{Ci(12, 12, 9)}{P("M12 11v5.500M12 7.500v.01")}</>);
export const CheckCircle = mk("CheckCircle", <>{Ci(12, 12, 9)}{P("M8.500 12.200l2.500 2.500 4.500-5")}</>);
export const Braces = mk("Braces", P("M9 4.500C7 4.500 7 6 7 8s0 3-2 4c2 1 2 2 2 4s0 3.500 2 3.500M15 4.500c2 0 2 1.500 2 3.500s0 3 2 4c-2 1-2 2-2 4s0 3.500-2 3.500"));
export const Square = mk("Square", <rect x="5" y="5" width="14" height="14" rx="2" />);
export const RefreshCw = mk("RefreshCw", P("M20 11a8 8 0 0 0-14-4.500L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.500L20 15M20 20v-5h-5"));
export const RotateCw = mk("RotateCw", P("M20 12a8 8 0 1 1-2.500-5.800L20 8.500M20 4v4.500h-4.500"));
export const RotateCcw = mk("RotateCcw", P("M4 12a8 8 0 1 0 2.500-5.800L4 8.500M4 4v4.500h4.500"));
export const Loader2 = mk("Loader2", P("M21 12a9 9 0 1 1-6.200-8.550"));
export const LoaderCircle = Loader2;
export const FlaskConical = mk("FlaskConical", P("M9.500 3.500h5M10 3.500v6L5 18.500a1.500 1.500 0 0 0 1.300 2.200h11.400a1.500 1.500 0 0 0 1.300-2.200L14 9.500v-6M7.500 14.500h9"));
export const BarChart3 = mk("BarChart3", P("M4 20.500h16M7 17v-6M12 17V5M17 17V9"));
export const MoreHorizontal = mk("MoreHorizontal", <>{Ci(6, 12, 1)}{Ci(12, 12, 1)}{Ci(18, 12, 1)}</>);
export const LogIn = mk("LogIn", P("M10 7.500l4.500 4.500-4.500 4.500M14.500 12H4M14 4.500h4.500v15H14"));
export const LogOut = mk("LogOut", P("M10 4.500H5.500v15H10M15 8l4 4-4 4M19 12H9"));
export const Pencil = mk("Pencil", P("M4 20l1-4L16.500 4.500a2.100 2.100 0 0 1 3 3L8 19zM14.500 6.500l3 3"));
export const ExternalLink = mk("ExternalLink", P("M14 4.500h5.500V10M19.500 4.500L11 13M18 14v4.500a1 1 0 0 1-1 1H5.500a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1H10"));
export const Megaphone = mk("Megaphone", P("M4 10v4a1 1 0 0 0 1 1h2l8 4.500V4.500L7 9H5a1 1 0 0 0-1 1zM19 9.500v5M7 15l1 5h2.500l-1-4.500"));
