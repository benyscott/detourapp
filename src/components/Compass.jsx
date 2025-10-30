import React from "react";
import styles from "./Compass.module.css";

const Compass = () => {
    return (
        <div id={styles.compass}>
            <div id={styles.needle}>
                <div id={styles.needleCircle}></div>
            </div>
        </div>
    );
};

export default Compass;

