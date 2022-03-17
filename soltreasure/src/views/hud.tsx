import * as React from 'react';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function TestButton(props:any) {
  return (
    <Button onClick={props.onClick} variant="contained">{props.children}</Button>
  );
}