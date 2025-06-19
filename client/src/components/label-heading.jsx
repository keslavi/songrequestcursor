import InfoPopover from './info-popover';
import { Info } from "./formhelper/info";

/**
 * @property {enum}
 * @param h1 large blue font
 * @param h2 medium blue font
 * @param h3 small blue font
 */
export const labelHeadingVariant = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
};

/**
 * @property {label}
 * @param variant h1,h2, h3... use string or enum labelHeadingVariant
 * @returns {label formatted by variant}
 */
export const LabelHeading = ({ props }) => {
  const id = new Date().getTime().toString();
  const variant = "labelHeadingRoot labelHeading" + (props.variant || "").toUpper();
  const color = props.headingColor;

  return (
    <>
      <span className={variant}>
        style={{
          display: "inline-flex",
          alignItems: "center",
          color: color || "black"
        }}
        gap: "8px"
      </span>
      {props.children}
      {props.info && <InfoPopover info={props.info} id={id} />}
      {props.infoquestion && <span
        style={{ position: "relative", left: '4%', padding }}>
        <Info
          id={`${id}Info`}
          info={props.infoquestion}
        />
      </span>
      }
    </>
  )
}
export default LabelHeading;
