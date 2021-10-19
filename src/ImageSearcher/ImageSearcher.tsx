import React from "react";
import styled from "styled-components";

// Functional

interface IState {
  keyword: string;
  isFetching: boolean;
  currentPage: number;
  data: IPhotos[];
  error: Error | null;
}

// {"photos":{"page":1,"pages":1332,"perpage":100,"total":133116,"photo":[]}
interface IPhotos {
  photos: {
    page: number;
    pages: number;
    perpage: number;
    total: number;
    photo: IPhoto[];
  };
}

// {
//   "id": "23451156376",
//   "owner": "28017113@N08",
//   "secret": "8983a8ebc7",
//   "server": "578",
//   "farm": 1,
//   "title": "Merry Christmas!",
//   "ispublic": 1,
//   "isfriend": 0,
//   "isfamily": 0
// }
interface IPhoto {
  id: string;
  farm: number;
  server: string;
  secret: string;
}

type TAction =
  | {
      type: "UPDATE_KEYWORD";
      keyword: string;
    }
  | {
      type: "WILL_SERACH";
    }
  | {
      type: "DID_SERACH";
      photos: IPhotos;
    }
  | {
      type: "DID_SERACH_ERROR";
      error: Error;
    };

function reducer(prevState: IState, action: TAction): IState {
  switch (action.type) {
    case "UPDATE_KEYWORD":
      return {
        ...prevState,
        keyword: action.keyword,
      };
    case "WILL_SERACH":
      return {
        ...prevState,
        isFetching: true,
      };
    case "DID_SERACH":
      return {
        ...prevState,
        isFetching: false,
        data: [...prevState.data, action.photos],
      };
    case "DID_SERACH_ERROR":
      return {
        ...prevState,
        isFetching: false,
        error: action.error,
      };
    default:
      return prevState;
  }
}

const initialState: IState = {
  keyword: "",
  isFetching: false,
  currentPage: 1,
  data: [],
  error: null,
};

function useSearcher() {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  const actions = React.useMemo(() => {
    return {
      updateKeyword: (keyword: string) =>
        dispatch({ type: "UPDATE_KEYWORD", keyword }),
      search: () => dispatch({ type: "WILL_SERACH" }),
      didSearch: (photos: IPhotos) => dispatch({ type: "DID_SERACH", photos }),
      didSearchError: (error: Error) =>
        dispatch({ type: "DID_SERACH_ERROR", error }),
    };
  }, [dispatch]);

  return {
    state,
    actions,
  };
}

// View

const ImageWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;

  > div {
    flex: 1 1 25%;
    width: 25%;

    display: flex;
    justify-content: center;
    align-items: center;

    & > img {
      max-width: 100%;
    }
  }
`;

function ImageSearcher() {
  const { state, actions } = useSearcher();

  const onChangeInput = React.useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      actions.updateKeyword(evt.target.value);
    },
    [actions]
  );

  const search = React.useCallback(() => {
    actions.search();

    fetch(
      "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=3e7cc266ae2b0e0d78e279ce8e361736&format=json&nojsoncallback=1&safe_search=1&text=kittens"
    )
      .then((res) => res.json())
      .then((data) => {
        actions.didSearch(data);
      })
      .catch((error) => {
        actions.didSearchError(error);
      });
  }, [actions]);

  return (
    <>
      <div>
        <input type="text" value={state.keyword} onChange={onChangeInput} />
        <button onClick={search} disabled={state.isFetching}>
          Search
        </button>
      </div>

      <ImageWrapper>
        {state.data.map((photos) => {
          return (photos?.photos?.photo || []).map(
            ({ farm, server, id, secret }) => {
              // http://farm{farm}.static.flickr.com/{server}/{id}_{secret}.jpg
              return (
                <div key={id}>
                  <img
                    src={`http://farm${farm}.static.flickr.com/${server}/${id}_${secret}.jpg`}
                    alt={id}
                  />
                </div>
              );
            }
          );
        })}
      </ImageWrapper>
    </>
  );
}

export default ImageSearcher;
