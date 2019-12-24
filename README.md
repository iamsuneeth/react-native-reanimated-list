# Reanimated List

animated FlatList implementation using react-native-reanimated

Usable with Expo!

## Installation

react-native-reanimated-list _expects react-native-reanimated_ and _react-native-gesture-handler_ to be installed.

Open a Terminal in the project root and run:

```sh
yarn add react-native-reanimated-list
```

or if you use `npm`:

```sh
npm install reanimated-bottom-sheet
```

## Usage

```javascript

import {AnimatedList} from 'react-native-reanimated-list';

const Example = () => {
  /* ..rest of the code */

  render() {
    return (
      <View style={{flex:1}}>
        <AnimatedList
        data={payees}
        listItemHeight={100} //optional
        keyExtractor={(item, index) => item.id} //mandatory
        renderItem={({ item, index }) => (
          <View key={item.id} style={{ flex: 1 }}>
            {/*  ...code */}
          </View>
        )}
      />
    </View>)
  }
}
```

## Props and rest of the documentation will follow soon.
