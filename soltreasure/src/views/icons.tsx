import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faKeySkeleton, 
    faTreasureChest, 
    faTrash, 
    faTimes, 
    faChevronSquareLeft,
    faChevronSquareRight,
    faPuzzlePiece,
    faBook,
    faUndo,
    faWallet,
    faPlay,
    faAngleUp,
    faAngleDown,
} from '@fortawesome/pro-regular-svg-icons'

export function GuideIcon() {
    return <FontAwesomeIcon icon={faBook}/>
}

export function PuzzleIcon() {
    return <FontAwesomeIcon icon={faPuzzlePiece} />
}

export function KeyIcon() {
    return <FontAwesomeIcon icon={faKeySkeleton} />
}

export function ChestIcon() {
  return <FontAwesomeIcon icon={faTreasureChest} />
}

export function RefreshIcon() {
    return <FontAwesomeIcon icon={faUndo}/>
}

export function WalletIcon() {
  return <FontAwesomeIcon icon={faWallet}/>
}

export function LogoutIcon() {
  return <FontAwesomeIcon icon={faWallet}/>
}

export function CancelIcon() {
  return <FontAwesomeIcon icon={faTimes}/>
}

export function TrashIcon() {
  return <FontAwesomeIcon icon={faTrash}/>
}

export function LeftIcon() {
  return <FontAwesomeIcon icon={faChevronSquareLeft}/>
}

export function RightIcon() {
  return <FontAwesomeIcon icon={faChevronSquareRight}/>
}

export function PlayIcon() {
  return <FontAwesomeIcon icon={faPlay}/>
}

export function UpIcon() {
  return <FontAwesomeIcon icon={faAngleUp}/>
}

export function DownIcon() {
  return <FontAwesomeIcon icon={faAngleDown}/>
}