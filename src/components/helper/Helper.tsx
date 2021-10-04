import css from "./Helper.module.less"
import React from "react"
import { merge } from "../../lib/utils/arrayUtils"

interface IProps {
  className?: string
  zoom: number
  setZoom: React.Dispatch<React.SetStateAction<number>>
  minimapZoom: number
  setMinimapZoom: React.Dispatch<React.SetStateAction<number>>
  pointCount: number
  setPointCount: React.Dispatch<React.SetStateAction<number>>
}

const componentName = "Helper"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Helper
 */
function Helper(props: IProps) {
  return (
    <div className={merge([css.root, props.className])}>
      <div className={css.row}>
        <span>Nombre de faux marqueurs : </span>
        <button
          className={merge([
            css.button,
            props.pointCount === 25 ? css.button_active : "",
          ])}
          onClick={() => {
            props.setPointCount(25)
          }}
        >
          25
        </button>
        <button
          className={merge([
            css.button,
            props.pointCount === 100 ? css.button_active : "",
          ])}
          onClick={() => {
            props.setPointCount(100)
          }}
        >
          100
        </button>
      </div>
      <div className={css.row}>
        <span>Niveau zoom carte principale : </span>
        <button
          className={merge([css.button, props.zoom === 18 ? css.button_active : ""])}
          onClick={() => {
            props.setZoom(18)
          }}
        >
          Plus zoomé
        </button>
        <button
          className={merge([css.button, props.zoom === 15 ? css.button_active : ""])}
          onClick={() => {
            props.setZoom(15)
          }}
        >
          Moins zoomé
        </button>
      </div>
      <div className={css.row}>
        <span>Niveau zoom mini carte :</span>
        <button
          className={merge([
            css.button,
            props.minimapZoom === 1 ? css.button_active : "",
          ])}
          onClick={() => {
            props.setMinimapZoom(1)
          }}
        >
          Plus zoomé
        </button>
        <button
          className={merge([
            css.button,
            props.minimapZoom === 0 ? css.button_active : "",
          ])}
          onClick={() => {
            props.setMinimapZoom(0)
          }}
        >
          Moins zoomé
        </button>
      </div>
    </div>
  )
}

export default Helper
