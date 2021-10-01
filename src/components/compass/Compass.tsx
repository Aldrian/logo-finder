import css from "./Compass.module.less"
import React from "react"
import { merge } from "../../lib/utils/arrayUtils"

interface IProps {
  className?: string
  angle: number
}

const componentName = "Compass"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Compass
 */
function Compass(props: IProps) {
  return (
    <div className={merge([css.root, props.className])}>
      <div className={css.wrapper}>
        <div
          className={css.arrow}
          style={{
            transform: `rotate(${props.angle}deg)`,
          }}
        >
          <span className={css.arrow_ball}></span>
        </div>
      </div>
    </div>
  )
}

export default Compass
