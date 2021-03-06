/* @flow */
import React, { Component } from 'react';
import {
  View,
  Animated,
  Dimensions,
  FlatList,
  PanResponder,
  Platform,
  StyleSheet,
} from 'react-native';

import type {
  CarouselProps,
  GestureEvent,
  GestureState,
  ScrollEvent,
} from '../types';

const { width: screenWidth } = Dimensions.get('window');
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

type State = {
  animatedValue: Animated.Value,
  currentIndex: number,
  itemWidthAnim: Animated.Value,
  scrollPosAnim: Animated.Value,
};

export default class SideSwipe extends Component<CarouselProps, State> {
  panResponder: PanResponder;
  list: typeof FlatList;

  static defaultProps = {
    contentOffset: 0,
    data: [],
    extractKey: (item: *, index: number) => `sideswipe-carousel-item-${index}`,
    itemWidth: screenWidth,
    onEndReached: () => {},
    onEndReachedThreshold: 0.9,
    onIndexChange: () => {},
    renderItem: () => null,
    shouldCapture: ({ dx }: GestureState) => Math.abs(dx) > 1,
    shouldRelease: () => false,
    isParentScrollEnabled: () => { return true; },
    enableParentScroll: () => {},
    disableParentScroll: () => {},
    threshold: Dimensions.get('window').width * .4,
    useVelocityForIndex: false,
    useNativeDriver: true,
  };

  constructor(props: CarouselProps) {
    super(props);

    const currentIndex: number = props.index || 0;
    const initialOffset: number = currentIndex * props.itemWidth;
    const scrollPosAnim: Animated.Value = new Animated.Value(initialOffset);
    const itemWidthAnim: Animated.Value = new Animated.Value(props.itemWidth);
    const animatedValue: Animated.Value = Animated.divide(
      scrollPosAnim,
      itemWidthAnim,
    );

    this.state = {
      animatedValue,
      currentIndex,
      itemWidthAnim,
      scrollPosAnim,
    };
  }

  componentWillMount = (): void => {
    this.panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: this.handleGestureCapture,
      onPanResponderGrant: this.handleGestureGrant,
      onPanResponderMove: this.handleGestureMove,
      onPanResponderRelease: this.handleGestureRelease,
      onPanResponderTerminationRequest: this.handleGestureTerminationRequest,
    });
  };

  componentDidUpdate = (prevProps: CarouselProps) => {
    const { contentOffset, index, itemWidth } = this.props;

    if (prevProps.itemWidth !== itemWidth) {
      this.state.itemWidthAnim.setValue(itemWidth);
    }

    if (Number.isInteger(index) && index !== prevProps.index) {
      this.setState(
        () => ({ currentIndex: index }),
        () => {
          setTimeout(() =>
            this.list.scrollToIndex({
              animated: true,
              index: this.state.currentIndex,
              viewOffset: this.state.currentIndex === this.props.data.length - 1 ? contentOffset + (this.props.itemWidth * .333) - (this.state.currentIndex * 10 + 5) : contentOffset + (this.props.itemWidth * .0666) - (this.state.currentIndex * 10 + 5),
            }),
          );
        },
      );
    }
  };

  render = () => {
    const {
      contentContainerStyle,
      contentOffset,
      data,
      extractKey,
      flatListStyle,
      renderItem,
      style,
    } = this.props;
    const { animatedValue, currentIndex, scrollPosAnim } = this.state;
    const dataLength = data.length;

    return (
      <View
        style={[{ width: screenWidth }, style]}
        {...this.panResponder.panHandlers}
      >
        <AnimatedFlatList
          horizontal
          contentContainerStyle={[
            { paddingHorizontal: contentOffset },
            contentContainerStyle,
          ]}
          data={data}
          getItemLayout={this.getItemLayout}
          keyExtractor={extractKey}
          initialScrollIndex={currentIndex}
          ref={this.getRef}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          style={[styles.flatList, flatListStyle]}
          onEndReached={this.props.onEndReached}
          onEndReachedThreshold={this.props.onEndReachedThreshold}
          scrollEventThrottle={1}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollPosAnim } } }],
            { useNativeDriver: this.props.useNativeDriver },
          )}
          renderItem={({ item, index }) =>
            renderItem({
              item,
              currentIndex,
              itemIndex: index,
              itemCount: dataLength,
              animatedValue: animatedValue,
            })
          }
        />
      </View>
    );
  };

  getRef = (ref: *) => {
    if (ref) {
      this.list = ref._component ? ref._component : ref;
    }
  };

  getItemLayout = (data: Array<*>, index: number) => ({
    offset: this.props.itemWidth * index + this.props.contentOffset,
    length: this.props.itemWidth,
    index,
  });

  handleGestureTerminationRequest = (e: GestureEvent, s: GestureState) => {
      return this.props.shouldRelease(s);
  }

  handleGestureGrant = (e: GestureEvent, s: GestureState) => {
      if(this.props.isParentScrollEnabled()) {
          this.props.disableParentScroll();
      }
      return
  }

  handleGestureCapture = (e: GestureEvent, s: GestureState) => {
      return this.props.shouldCapture(s);
  }

  handleGestureMove = (e: GestureEvent, { dx, dy }: GestureState) => {
      if(this.props.isParentScrollEnabled()) {
          this.props.disableParentScroll();
      }

      const currentOffset: number =
        this.state.currentIndex === this.props.data.length - 1 ? (this.state.currentIndex * this.props.itemWidth) + (this.state.currentIndex * 10 + 5) - (this.props.itemWidth * .333) : (this.state.currentIndex * this.props.itemWidth) - (this.props.itemWidth * .0666) + (this.state.currentIndex * 10 + 5);
      const resolvedOffset: number = currentOffset - (dx * 1.5);

      this.list.scrollToOffset({
        offset: resolvedOffset,
        animated: false,
      });
  };

  handleGestureRelease = (e: GestureEvent, { dx, vx }: GestureState) => {
    const currentOffset: number =
    this.state.currentIndex === this.props.data.length - 1 ? (this.state.currentIndex * this.props.itemWidth) - (this.props.itemWidth * .333)  - (this.state.currentIndex * 10 + 5) : (this.state.currentIndex * this.props.itemWidth) + (this.props.itemWidth * .0666) + (this.state.currentIndex * 10 + 5);
    const resolvedOffset: number = currentOffset - (dx * 1.5);

    const resolvedIndex: number = Math.round(
      (resolvedOffset +
        (dx > 0 ? -this.props.threshold : this.props.threshold)) /
        this.props.itemWidth,
    );

    let newIndex: number;
    if (this.props.useVelocityForIndex) {
      const absoluteVelocity: number = Math.round(Math.abs(vx));
      const velocityDifference: number =
        absoluteVelocity < 1 ? 0 : absoluteVelocity - 1;

      newIndex =
        dx > 0
          ? Math.max(resolvedIndex - velocityDifference, 0)
          : Math.min(
              resolvedIndex + velocityDifference,
              this.props.data.length - 1,
            );
    } else {
      newIndex =
        dx > 0
          ? Math.max(resolvedIndex, 0)
          : Math.min(resolvedIndex, this.props.data.length - 1);
        console.log("dx: " + dx)
        console.log("newIndex: " + newIndex)
    }

    if(!this.props.isParentScrollEnabled()) {
        this.props.enableParentScroll();
    }

    this.list.scrollToIndex({
      index: newIndex,
      animated: true,
      viewOffset: newIndex === this.props.data.length - 1 ? this.props.itemWidth * .333  - (this.state.currentIndex * 10 + 5) : this.props.contentOffset + (this.props.itemWidth * .0666) - (this.state.currentIndex * 10 + 5),
    });

    this.setState(
      () => ({ currentIndex: newIndex }),
      () => this.props.onIndexChange(newIndex),
    );
  };
}

const styles = StyleSheet.create({
  flatList: {
    flexGrow: 1,
  },
});
