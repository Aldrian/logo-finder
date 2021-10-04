import css from "./Popin.module.less"
import React from "react"
import { merge } from "../../lib/utils/arrayUtils"
import { IMarker } from "components/map/Map"

interface IProps {
  className?: string
  marker: IMarker
  onClose: () => void
}

const componentName = "Popin"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Popin
 */
function Popin(props: IProps) {
  return (
    <div className={merge([css.root, props.className])}>
      <div className={css.wrapper}>
        <p>{props.marker.real ? "Gagné !" : "Réessaie !"}</p>
        <button
          onClick={() => {
            props.onClose()
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

export default Popin
