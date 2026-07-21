import React from "react";
import { Composition } from "remotion";
import { TodoDemo } from "./TodoDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="TodoDemo"
      component={TodoDemo}
      durationInFrames={150}
      fps={30}
      width={720}
      height={720}
    />
  );
};
