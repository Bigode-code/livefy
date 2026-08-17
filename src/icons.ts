import { createElement } from 'react';
import {
  Activity, Add, ArrangeVertical, ArrowDown2, ArrowRight as SaxArrowRight,
  ArrowRight2, ArrowRotateLeft, ArrowSwapVertical, Back, Box1, Calendar,
  Category2, Chart1, Chart2, CloseCircle, CloseSquare, Cloud as SaxCloud, Diagram,
  Apple as SaxApple, CodeCircle, DocumentText, Eye as SaxEye, EyeSlash as SaxEyeSlash, Filter, Global, Google as SaxGoogle, HambergerMenu, Health, Hierarchy3, I3Dcube,
  LampOn, MagicStar, Menu, MessageText1, Messages1, Monitor, Moon as SaxMoon, Game, Card, Cpu, Link2, Layer,
  More, Next, Notification, Pause as SaxPause, Play as SaxPlay,
  PlayCircle as SaxPlayCircle, Refresh, Refresh2, SearchNormal1, Send2,
  Setting2, ShieldTick, StopCircle, Sun1, Timer1, TickCircle, TickSquare as SaxTickSquare, Video,
  VideoPlay as SaxVideoPlay, VolumeHigh, type Icon,
} from 'iconsax-react';

/** Iconsax omits its paint attributes when color is undefined. */
const visible=(Source:Icon):Icon=>{
  const Wrapped:Icon=props=>createElement(Source,{...props,color:props.color??'currentColor'});
  return Wrapped;
};

export const Pulse=visible(Activity);
export const Plus=visible(Add);
export const ArrowsDownUp=visible(ArrangeVertical);
export const ArrowRight=visible(SaxArrowRight);
export const CaretRight=visible(ArrowRight2);
export const ArrowCounterClockwise=visible(ArrowRotateLeft);
export const CaretUpDown=visible(ArrowSwapVertical);
export const ArrowUUpLeft=visible(Back);
export const Package=visible(Box1);
export const CalendarBlank=visible(Calendar);
export const SquaresFour=visible(Category2);
export const ChartLineUp=visible(Chart1);
export const ChartBars=visible(Chart2);
export const X=visible(CloseCircle);
export const PushPinSlash=visible(CloseSquare);
export const Cloud=visible(SaxCloud);
export const TreeStructure=visible(Diagram);
export const ListMagnifyingGlass=visible(DocumentText);
export const Funnel=visible(Filter);
export const GlobeHemisphereWest=visible(Global);
export const List=visible(HambergerMenu);
export const Stethoscope=visible(Health);
export const FlowArrow=visible(Hierarchy3);
export const Cube=visible(I3Dcube);
export const LightbulbFilament=visible(LampOn);
export const Sparkle=visible(MagicStar);
export const DotsSixVertical=visible(Menu);
export const ChatCenteredText=visible(MessageText1);
export const ChatsCircle=visible(Messages1);
export const Browser=visible(Monitor);
export const Desktop=visible(Monitor);
export const Moon=visible(SaxMoon);
export const DotsThree=visible(More);
export const SkipForward=visible(Next);
export const Bell=visible(Notification);
export const Pause=visible(SaxPause);
export const Play=visible(SaxPlay);
export const PlayCircle=visible(SaxPlayCircle);
export const ArrowClockwise=visible(Refresh);
export const ArrowsClockwise=visible(Refresh2);
export const MagnifyingGlass=visible(SearchNormal1);
export const PaperPlaneTilt=visible(Send2);
export const GearSix=visible(Setting2);
export const ShieldCheck=visible(ShieldTick);
export const Stop=visible(StopCircle);
export const Sun=visible(Sun1);
export const Timer=visible(Timer1);
export const CheckCircle=visible(TickCircle);
export const Broadcast=visible(Video);
export const VideoPlay=visible(SaxVideoPlay);
export const SpeakerHigh=visible(VolumeHigh);
export const CaretDown=visible(ArrowDown2);
export const Eye=visible(SaxEye);
export const EyeSlash=visible(SaxEyeSlash);
export const Apple=visible(SaxApple);
export const Google=visible(SaxGoogle);
export const CodeRepository=visible(CodeCircle);
export const TickSquare=visible(SaxTickSquare);
export const GameController=visible(Game);
export const CreditCard=visible(Card);
export const Processor=visible(Cpu);
export const Link=visible(Link2);
export const Layers=visible(Layer);
