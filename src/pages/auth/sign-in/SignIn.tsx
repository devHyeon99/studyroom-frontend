import Logo from '../../../assets/logo.png';
import Kakao from '../../../assets/kakao_logo.svg';

import { Button, Input } from '../../../components';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';

interface UserInfo {
  username: string;
  password: string;
  [key: string]: string;
}

interface UserInfoError {
  username: boolean;
  password: boolean;
  [key: string]: boolean;
}

const initialUserInfo = { username: '', password: '' };

const initialUserInfoError = { username: false, password: false };

const SignIn = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [userInfoError, setUserInfoError] =
    useState<UserInfoError>(initialUserInfoError);

  const [_, setCookie] = useCookies(['accessToken']);

  useEffect(() => {
    disappearError('username');
  }, [userInfo.username]);

  useEffect(() => {
    disappearError('password');
  }, [userInfo.password]);

  // Input 유효성 에러 발생 -> onChange 시 사라짐
  const disappearError = (field: string) => {
    const newUserInfoObject = { ...userInfo };

    if (newUserInfoObject[field].length !== 0) {
      const newUserInfoErrorObject = { ...userInfoError };
      newUserInfoErrorObject[field] = false;
      setUserInfoError(newUserInfoErrorObject);
    }
  };

  // Input들의 onChange 함수 (value: 입력한 값, field: 객체 키)
  const onChangeInput = (value: string, field: string) => {
    const updatedObject = { ...userInfo };
    updatedObject[field] = value;
    setUserInfo(updatedObject);
  };

  // 일반 로그인
  const onSignIn = async () => {
    try {
      if (checkEmptyInputAndFocus()) {
        return;
      }

      // access token 저장 로직 및 토큰 만료 시 어떻게 할지
      const { username, password } = userInfo;

      if (username.length === 0) {
        setUserInfoError((prev) => ({ ...prev, username: true }));
        return;
      }

      if (password.length === 0) {
        setUserInfoError((prev) => ({ ...prev, password: true }));
        return;
      }

      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const response = await fetch('/api/login', {
        method: 'POST',
        body: formData,
      });

      // refresh token은 나중에 진행
      const accessToken = response.headers.get('Authorization')?.split(' ')[1];
      if (accessToken) {
        setCookie('accessToken', accessToken, {
          maxAge: 60 * 60 * 10,
        });

        alert('로그인 되었습니다.');
        navigate('/');
      } else {
        alert(
          '로그인에 실패하였습니다. 아이디 혹은 비밀번호를 다시 입력해 주세요.'
        );
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  // TODO 카카오 로그인 - 서버가 쿠키에 access token을 저장(만료 시 로그인 페이지로 이동)
  const onSignInKakao = async () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
  };

  // 입력되지 않은 Input이 있을 시, 에러 문구 렌더링 및 focus 이동
  const checkEmptyInputAndFocus = () => {
    for (const [field, value] of Object.entries(userInfo)) {
      if (value.length === 0) {
        setUserInfoError((prev) => ({ ...prev, [field]: true }));
        document.getElementById(field)?.focus();
        return true;
      }
    }
    return false;
  };

  return (
    <div className="w-screen h-screen bg-blue_05 ">
      <div className="mx-auto max-w-[480px] h-full flex flex-col items-center gap-5 pt-[110px] pb-5">
        {/* Login Section */}
        <section className="w-full ">
          <a href="/">
            <div className="flex justify-center items-center gap-2.5 mb-[15px]">
              <h1
                className="text-[60px] font-semibold text-main"
                style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.1)' }}
              >
                StudyRoom
              </h1>
              <img src={Logo} alt="임시 로고" />
            </div>
          </a>
          <div className="shadow-box_01 bg-white rounded-2xl flex flex-col items-center  py-[60px]">
            <span className="text-[32px] leading-10 font-extrabold mb-[65px]">
              걱정 없이 함께 하는 <br />
              스터디 서비스
            </span>
            <form
              action="submit"
              className="w-[264px] flex flex-col items-center gap-4"
            >
              <div className="w-full flex flex-col gap-1">
                <Input
                  label="아이디"
                  value={userInfo.username}
                  onChange={(event) =>
                    onChangeInput(event.target.value, 'username')
                  }
                />
                {userInfoError.username && (
                  <span className="text-[11px] text-red-400 px-2">
                    아이디를 입력해 주세요.
                  </span>
                )}
              </div>
              <div className="w-full flex flex-col gap-1">
                <Input
                  type="password"
                  label="비밀번호"
                  value={userInfo.password}
                  onChange={(event) =>
                    onChangeInput(event.target.value, 'password')
                  }
                />
                {userInfoError.password && (
                  <span className="text-[11px] text-red-400 px-2">
                    비밀번호를 입력해 주세요.
                  </span>
                )}
              </div>
            </form>
            <div className="w-[264px] flex flex-col items-center gap-3 mt-[47px]">
              <Button
                text="로그인"
                blueType="dark"
                onClick={onSignIn}
                className="text-[14px] h-[47px]"
              />
              <Button
                text="회원가입"
                onClick={() => navigate('/sign-up')}
                blueType="light"
                className="text-[14px] h-[47px]"
              />
              <button
                onClick={onSignInKakao}
                className="shadow-box_02 w-[264px] h-[47px] rounded-xl bg-[#FEE500] flex justify-center items-center gap-5"
              >
                <img src={Kakao} alt="카카오 로고" />
                <span className="text-[14px] font-semibold">
                  카카오계정으로 로그인
                </span>
              </button>
              <div className="flex items-center">
                <button className="text-[10px] text-[#bbb] p-2 pr-0">
                  아이디
                </button>
                <span className="text-[10px] text-[#bbb] px-1">|</span>
                <button className="text-[10px] text-[#bbb] p-2 pl-0">
                  비밀번호 찾기
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Ads Section */}
        <section className="w-[480px] h-[230px] bg-black rounded-2xl"></section>
      </div>
    </div>
  );
};

export default SignIn;
