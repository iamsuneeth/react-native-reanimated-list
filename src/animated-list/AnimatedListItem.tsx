import React from "react";
import Animated, { Easing } from "react-native-reanimated";

type Props = {
  component: React.ReactNode;
  animation?: Animated.Value<number>;
  height?: number;
};

export const AnimatedListItem = React.memo((props: Props) => {
  const height = props.animation
    ? props.animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, props.height || 0]
      })
    : props.height || "auto";
  return (
    <Animated.View
      style={{
        flex: 1,
        height: props.height ? height : "auto",
        opacity: props.animation || 1
      }}
    >
      {props.component}
    </Animated.View>
  );
});
