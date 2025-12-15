import {
  CommonActions,
  createNavigationContainerRef,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export const navigate = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};

export const push = (name, params) => {
  if (navigationRef.isReady()) {
    //@ts-ignore
    navigationRef.push(name, params);
  }
};

export const reset = (name, params) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name, params }] }),
    );
  }
};
export const goBack = () => {
  if (navigationRef.isReady()) {
    console.log(navigationRef?.canGoBack())
    if (!navigationRef?.canGoBack()) {
      navigationRef.dispatch(
        CommonActions.reset({ index: 1, routes: [{ name: 'App' }] })
      )
      return
    }
    navigationRef.goBack();
  }
};
