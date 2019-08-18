import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
    h2: {
        color: 'red',
    }
}));

function DabkaMarker(props) {
  const classes = useStyles();
  return (
    <div>
        <h2 className={classes.h2}>{props.dogName} was here</h2>
    </div>
  );
}

export default DabkaMarker;
