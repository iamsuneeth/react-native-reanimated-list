import React, { useEffect, useReducer, useRef, useState } from "react";
import { FlatListProps, FlatList } from "react-native";
import { NativeViewGestureHandlerProperties } from "react-native-gesture-handler";
import { AnimatedListItem } from "./AnimatedListItem";
import { isEmpty, differenceBy, unionBy } from "lodash";
import Animated, { Easing } from "react-native-reanimated";

const {
  Clock,
  Value,
  set,
  cond,
  startClock,
  clockRunning,
  timing,
  stopClock,
  block,
  useCode,
  call
} = Animated;

function runTiming(
  clock: Animated.Clock,
  value: number,
  dest: number,
  callBack = () => {}
) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0)
  };

  const config = {
    duration: 200,
    toValue: new Value(0),
    easing: Easing.inOut(Easing.ease)
  };

  return block([
    cond(
      clockRunning(clock),
      [set(config.toValue, dest)],
      [
        set(state.finished, 0),
        set(state.time, 0),
        set(state.position, value),
        set(state.frameTime, 0),
        set(config.toValue, dest),
        startClock(clock)
      ]
    ),
    timing(clock, state, config),
    cond(state.finished, [stopClock(clock), call([], callBack)]),
    state.position
  ]);
}

type Props<T> = NativeViewGestureHandlerProperties &
  Omit<FlatListProps<T>, "keyExtractor"> & {
    listItemHeight?: number;
    keyExtractor: KeyExtractorType<T>;
  };
type KeyExtractorType<T> = (item: T, index: number) => string;

type Data<T> = {
  key: string;
  item: T;
};

type StateType<T> = {
  data: Data<T>[];
  exactData: T[];
  addedMap: { [key: string]: boolean };
  deletedMap: { [key: string]: boolean };
};

const useDebounce = <T extends {}>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const cloneArray = <T extends any>(
  listArray: readonly any[],
  keyExtractor: KeyExtractorType<T>
) => {
  return listArray.map((item, index) => {
    return {
      key: keyExtractor(item, index),
      item,
      deleted: false
    };
  });
};

const getKeys = <T extends any>(
  array: readonly T[],
  keyExtractor: KeyExtractorType<T>
) => {
  const keys: { [key: string]: boolean } = {};
  array.forEach(
    (element, index) => (keys[keyExtractor(element, index)] = true)
  );
  return keys;
};

export const AnimatedList = <T extends { key?: string; id?: string | number }>(
  props: Props<T>
) => {
  if (!props.keyExtractor) {
    throw Error("keyExtractor prop is mandatory");
  }
  let latest = true;
  const appearAnimation = useRef<Animated.Value<number>>(new Value(0));
  const deleteAnimation = useRef<Animated.Value<number>>(new Value(1));
  const clockInRef = useRef(new Clock());
  const clockOutRef = useRef(new Clock());

  const [state, setState] = useReducer(
    (oldState: StateType<T>, newState: Partial<StateType<T>>) => ({
      ...oldState,
      ...newState
    }),
    {
      data: cloneArray(props.data || [], props.keyExtractor),
      exactData: (props.data || []).slice(),
      addedMap: getKeys(props.data || [], props.keyExtractor),
      deletedMap: {}
    }
  );

  const debouncedData = useDebounce(props.data || [], 500);

  useEffect(() => {
    const modifiedData = debouncedData.map((item, index) => {
      return {
        key: props.keyExtractor(item, index),
        item
      };
    });
    const deleted = differenceBy<Data<T>, { key: string; item: T }>(
      state.data,
      modifiedData,
      "key"
    );

    const added = differenceBy<{ key: string; item: T }, Data<T>>(
      modifiedData,
      state.data,
      "key"
    ).map(elem => elem.item);

    const newData = unionBy(modifiedData, state.data, "key");
    const newExactData = newData.map(elem => elem.item);

    const newDeleteMap: { [key: string]: boolean } = {};
    const newAddedMap: { [key: string]: boolean } = {};
    deleted.forEach(elem => (newDeleteMap[elem.key] = true));
    added.forEach(
      (elem, index) => (newAddedMap[props.keyExtractor(elem, index)] = true)
    );
    if (!isEmpty(newAddedMap) || !isEmpty(newDeleteMap)) {
      setState({
        exactData: newExactData,
        data: newData,
        addedMap: newAddedMap,
        deletedMap: newDeleteMap
      });
    }
    return () => {
      latest = false;
    };
  }, [debouncedData]);

  useCode(() => {
    if (!isEmpty(state.deletedMap)) {
      return set(
        deleteAnimation.current,
        runTiming(clockOutRef.current, 1, 0, handleDelete)
      );
    }
    return deleteAnimation.current;
  }, [state.deletedMap]);

  useCode(() => {
    if (!isEmpty(state.addedMap)) {
      return set(
        appearAnimation.current,
        runTiming(clockInRef.current, 0, 1, handleAppearEnd)
      );
    }
    return appearAnimation.current;
  }, [state.addedMap]);

  const handleDelete = () => {
    if (latest) {
      setState({
        exactData: debouncedData.slice(),
        data: cloneArray(debouncedData, props.keyExtractor),
        deletedMap: {}
      });
      deleteAnimation.current.setValue(1);
    }
  };

  const handleAppearEnd = () => {
    setState({
      addedMap: {}
    });
  };

  return (
    <FlatList
      {...props}
      data={state.exactData}
      renderItem={({ item, index, ...rest }) => {
        const propComponent = props.renderItem({
          item,
          index,
          ...rest
        });
        const key = props.keyExtractor(item, index);
        const animation =
          key in state.deletedMap
            ? deleteAnimation.current
            : key in state.addedMap
            ? appearAnimation.current
            : undefined;
        return (
          <AnimatedListItem
            height={props.listItemHeight}
            animation={animation}
            component={propComponent}
          />
        );
      }}
    />
  );
};
