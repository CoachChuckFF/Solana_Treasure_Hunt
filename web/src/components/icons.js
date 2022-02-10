import * as React from 'react';
import PropTypes from 'prop-types';
import SvgIcon from '@mui/material/SvgIcon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { faPuzzlePiece, faBook, faUndo, faWallet, faTimes, faPlay, faAngleUp, faAngleDown } from '@fortawesome/free-solid-svg-icons'
import { faKeySkeleton, faTreasureChest, faTrash, faChevronSquareLeft, faChevronSquareRight } from '@fortawesome/pro-regular-svg-icons'

const FontAwesomeSvgIcon = React.forwardRef((props, ref) => {
  const { icon } = props;

  const {
    icon: [width, height, , , svgPathData],
  } = icon;

  return (
    <SvgIcon ref={ref} viewBox={`0 0 ${width} ${height}`}>
      {typeof svgPathData === 'string' ? (
        <path d={svgPathData} />
      ) : (
        /**
         * A multi-path Font Awesome icon seems to imply a duotune icon. The 0th path seems to
         * be the faded element (referred to as the "secondary" path in the Font Awesome docs)
         * of a duotone icon. 40% is the default opacity.
         *
         * @see https://fontawesome.com/how-to-use/on-the-web/styling/duotone-icons#changing-opacity
         */
        svgPathData.map((d, i) => (
          <path style={{ opacity: i === 0 ? 0.4 : 1 }} d={d} />
        ))
      )}
    </SvgIcon>
  );
});

FontAwesomeSvgIcon.propTypes = {
  icon: PropTypes.any.isRequired,
};

export function GuideIcon(props) {
    return <FontAwesomeIcon icon={faBook}/>
}

export function PuzzleIcon(props) {
    return <FontAwesomeIcon icon={faPuzzlePiece} />
}

export function KeyIcon(props) {
    return <FontAwesomeIcon icon={faKeySkeleton} />
}

export function ChestIcon(props) {
  return <FontAwesomeIcon icon={faTreasureChest} />
}

export function RefreshIcon(props) {
    return <FontAwesomeIcon icon={faUndo}/>
}

export function WalletIcon(props) {
  return <FontAwesomeIcon icon={faWallet}/>
}

export function CancelIcon(props) {
  return <FontAwesomeIcon icon={faTimes}/>
}

export function TrashIcon(props) {
  return <FontAwesomeIcon icon={faTrash}/>
}

export function LeftIcon(props) {
  return <FontAwesomeIcon icon={faChevronSquareLeft}/>
}

export function RightIcon(props) {
  return <FontAwesomeIcon icon={faChevronSquareRight}/>
}

export function PlayIcon(props) {
  return <FontAwesomeIcon icon={faPlay}/>
}

export function UpIcon(props) {
  return <FontAwesomeIcon icon={faAngleUp}/>
}

export function DownIcon(props) {
  return <FontAwesomeIcon icon={faAngleDown}/>
}