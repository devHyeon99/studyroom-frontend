import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button, Input, Modal, Select } from '../../../components';
import { Education } from '../../../data/Education';
import { Gender } from '../../../data/Gender';

import Logo from '../../../assets/logo.png';

import { useTimer } from 'react-timer-hook';

interface UserInfo extends SignUp {
  passwordCheck: string;
  code: string;
  [key: string]: string;
}

interface SignUp {
  username: string;
  password: string;
  email: string;
  name: string;
  birth: string;
  gender: string;
}

interface UserInfoError {
  username: boolean;
  password: boolean;
  passwordCheck: boolean;
  email: boolean;
  name: boolean;
  birth: boolean;
  gender: boolean;
  code: boolean;
  [key: string]: boolean;
}

const initialUserInfo = {
  username: '',
  password: '',
  passwordCheck: '',
  email: '',
  name: '',
  birth: '',
  gender: '',
  code: '',
  // education: '',
};

const initialUserInfoError = {
  username: false,
  password: false,
  passwordCheck: false,
  email: false,
  name: false,
  birth: false,
  gender: false,
  code: false,
};

// 학력은 출시 전에 추가, 현재는 이름, 나이를 text로 받으나 나중에는 변경할 수도 있음
const SignUp = () => {
  const navigate = useNavigate();
  const expiryTimestamp = new Date();
  expiryTimestamp.setSeconds(expiryTimestamp.getSeconds() + 300);
  const { seconds, minutes, pause, restart } = useTimer({
    expiryTimestamp,
    autoStart: false,
    onExpire: () => console.warn('onExpire called'),
  });

  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [userInfoError, setUserInfoError] =
    useState<UserInfoError>(initialUserInfoError);
  const [isDuplicated, setIsDuplicated] = useState<boolean | null>(null);
  const [isCertifing, setIsCertifing] = useState(false);
  const [isCertifyOpen, setIsCertifyOpen] = useState(false);

  useEffect(() => {
    disappearError('username');
  }, [userInfo.username]);

  // 패스워드 유효성 검사
  useEffect(() => {
    if (userInfo.password.length !== 0) {
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,16}$/;
      setUserInfoError((prev) => ({
        ...prev,
        password: !passwordRegex.test(userInfo.password) ? true : false,
      }));
    }
  }, [userInfo.password]);

  // 패스워드와 패스워드 확인 값이 일치 여부 검사
  useEffect(() => {
    if (userInfo.passwordCheck.length !== 0) {
      setUserInfoError((prev) => ({
        ...prev,
        passwordCheck:
          userInfo.passwordCheck.length !== 0 &&
          userInfo.password !== userInfo.passwordCheck
            ? true
            : false,
      }));
    }
  }, [userInfo.passwordCheck]);

  useEffect(() => {
    disappearError('email');
  }, [userInfo.email]);

  useEffect(() => {
    disappearError('name');
  }, [userInfo.name]);

  useEffect(() => {
    disappearError('birth');
  }, [userInfo.birth]);

  useEffect(() => {
    disappearError('gender');
  }, [userInfo.gender]);

  useEffect(() => {
    disappearError('code');
  }, [userInfo.code]);

  // 인증번호 입력 모달 on/off 시 모달에 쓰이는 데이터 초기화
  useEffect(() => {
    setUserInfoError((prev) => ({ ...prev, code: false }));
    setUserInfo((prev) => ({ ...prev, code: '' }));
  }, [isCertifyOpen]);

  // Input 유효성 에러 발생 -> onChange 시 사라짐
  const disappearError = (field: string) => {
    const newUserInfoObject = { ...userInfo };

    if (newUserInfoObject[field].length !== 0) {
      if (field === 'username') {
        setIsDuplicated(null);
      }

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

  // 아이디 중복 확인(아이디는 3~16자 소문자+숫자로만 이루어짐)
  // 비밀번호 8 ~ 16자 대문자+소문자+숫자+특수문자(키패드 1번 ~ 7번까지만 '+', '=')로만 이루어짐
  // 비밀번호 유효성 검사는 backend에서 적용한 정규식 참고하면 됨
  const onCheckDuplicatedId = async () => {
    try {
      const usernameRegex = /^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{3,16}$/;
      if (!usernameRegex.test(userInfo.username)) {
        setUserInfoError((prev) => ({ ...prev, username: true }));
        return;
      }

      const response = await fetch(`/api/member/username`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: userInfo.username,
      });
      const duplicatedResult = await response.json();

      if (duplicatedResult) {
        alert('이미 사용중인 아이디입니다.');
        setIsDuplicated(true);
      } else {
        alert('사용 가능한 아이디입니다.');
        setIsDuplicated(false);
      }
    } catch (error: any) {
      if (error.name === 'SyntaxError') {
        alert('아이디는 영소문자와 숫자를 하나씩 포함한 3~16자리입니다.');
      }
      console.log(error.name);
    }
  };

  // 타이머 리셋
  const restartTimer = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + 300);
    restart(time);
  };

  // 이메일로 인증번호 보내기
  const onCertifyEmail = async () => {
    try {
      restartTimer();
      await fetch(`/api/auth/new/email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: userInfo.email,
      });
    } catch (error: any) {
      console.log(error);
    }
  };

  // 이메일로 인증번호 재전송
  const onResendCertifyEmail = async () => {
    alert('재전송 되었습니다.');

    restartTimer();
    await onCertifyEmail();
  };

  // 인증번호 모달 toggle
  const onToggleCertifyModal = () => {
    const emailRegex =
      // eslint-disable-next-line no-useless-escape
      /^[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i;
    if (!emailRegex.test(userInfo.email)) {
      setUserInfoError((prev) => ({ ...prev, email: true }));
      return;
    }

    onCertifyEmail();

    setIsCertifyOpen((prev) => !prev);
  };

  // 인증번호 서버로 보내기
  const onSendCertifyNumber = async () => {
    try {
      if (minutes === 0 && seconds === 0) {
        alert('입력 시간이 지났습니다. 인증번호 재전송 후 다시 입력해 주세요.');
        return;
      }

      const { email, code } = userInfo;

      if (code.length === 0) {
        setUserInfoError((prev) => ({ ...prev, code: true }));
        return;
      }

      const response = await fetch(`/api/auth/email`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });
      const isCheckCertify = await response.json();

      if (isCheckCertify) {
        setIsCertifyOpen(false);
        setUserInfoError((prev) => ({ ...prev, code: false }));
        setIsCertifing(true);
        pause();
      } else {
        setUserInfoError((prev) => ({ ...prev, code: true }));
      }
    } catch (error: any) {
      setUserInfoError((prev) => ({ ...prev, code: true }));
      console.log(error.name);
    }
  };

  // 입력하지 않은 Input이 있을 시, 에러 문구 렌더링 및 focus 이동
  const checkEmptyInputAndFocus = () => {
    for (const [field, value] of Object.entries(userInfo)) {
      if (field !== 'code' && value.length === 0) {
        setUserInfoError((prev) => ({ ...prev, [field]: true }));
        document.getElementById(field)?.focus();
        return true;
      }
    }
    return false;
  };

  // 회원가입
  const onSignUp = async () => {
    try {
      const { username, password, passwordCheck, name, email, birth, gender } =
        userInfo;

      if (checkEmptyInputAndFocus()) {
        return;
      }

      if (password !== passwordCheck) {
        alert('비밀번호 확인이 일치하지 않습니다.');
        return;
      }

      if (isDuplicated) {
        alert('아이디 중복 확인 과정을 진행해 주세요.');
        return;
      }

      if (!isCertifing) {
        alert('이메일 인증 과정을 진행해 주세요.');
        return;
      }

      await fetch(`/api/member/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: JSON.stringify({
          username,
          password,
          email,
          name,
          birth,
          gender,
        }),
      });

      alert('회원가입 되었습니다.');
      navigate('/sign-in');
    } catch (error: any) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="w-screen h-screen bg-blue_05 ">
        <div className="mx-auto max-w-[480px] h-full flex flex-col items-center gap-5 pt-[110px] pb-5">
          {/* Sign Up Section */}
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
                회원가입
              </span>
              <form
                action="submit"
                className="w-[264px] flex flex-col items-center gap-4"
              >
                <div className="w-full flex gap-2">
                  <div className="w-3/4">
                    <div className="w-full flex flex-col gap-1">
                      <Input
                        id="username"
                        label="아이디"
                        value={userInfo.username}
                        onChange={(event) =>
                          onChangeInput(event.target.value, 'username')
                        }
                      />
                      {userInfoError.username && (
                        <span className="text-[11px] text-red-400 px-2">
                          아이디는 영소문자와 숫자를 하나씩 포함한
                          3~16자리입니다.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-1/4">
                    <Button
                      blueType="dark"
                      text="중복 확인"
                      onClick={onCheckDuplicatedId}
                      className="text-[10px]"
                    />
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Input
                    id="password"
                    type="password"
                    label="비밀번호"
                    value={userInfo.password}
                    onChange={(event) =>
                      onChangeInput(event.target.value, 'password')
                    }
                  />
                  {userInfoError.password && (
                    <span className="text-[11px] text-red-400 px-2">
                      비밀번호는 영문 대소문자와 숫자, 특수문자를 하나씩 포함한
                      8~16자리입니다.
                    </span>
                  )}
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Input
                    id="passwordCheck"
                    type="password"
                    label="비밀번호 확인"
                    value={userInfo.passwordCheck}
                    onChange={(event) =>
                      onChangeInput(event.target.value, 'passwordCheck')
                    }
                  />
                  {userInfoError.passwordCheck && (
                    <span className="text-[11px] text-red-400 px-2">
                      비밀번호가 일치하지 않습니다.
                    </span>
                  )}
                </div>
                <div className="w-full flex gap-2">
                  <div className="w-3/4">
                    <div className="w-full flex flex-col gap-1">
                      <Input
                        id="email"
                        disabled={isCertifing}
                        type="email"
                        label="이메일"
                        value={userInfo.email}
                        onChange={(event) =>
                          onChangeInput(event.target.value, 'email')
                        }
                      />
                      {userInfoError.email && (
                        <span className="text-[11px] text-red-400 px-2">
                          이메일 형식에 맞게 입력해 주세요.
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-1/4">
                    <Button
                      disabled={isCertifing && !isCertifyOpen}
                      blueType="dark"
                      text="인증"
                      onClick={onToggleCertifyModal}
                      className="text-[10px] w-[57px]"
                    />
                  </div>
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Input
                    id="name"
                    type="text"
                    label="이름"
                    value={userInfo.name}
                    onChange={(event) =>
                      onChangeInput(event.target.value, 'name')
                    }
                  />
                  {userInfoError.name && (
                    <span className="text-[11px] text-red-400 px-2">
                      유효한 이름을 입력해 주세요.
                    </span>
                  )}
                </div>
                <div className="w-full flex flex-col gap-1">
                  <Input
                    id="birth"
                    label="나이"
                    value={userInfo.birth}
                    onChange={(event) =>
                      onChangeInput(event.target.value, 'birth')
                    }
                  />
                  {userInfoError.birth && (
                    <span className="text-[11px] text-red-400 px-2">
                      유효한 나이를 입력해 주세요.
                    </span>
                  )}
                </div>

                {/* <Select
                options={Education}
                placeholder="학력"
                value={userInfo.education}
                setValue={(value) => onChangeInput(value ?? '', 'education')}
              /> */}
                <div className="w-full flex flex-col gap-1">
                  <Select
                    options={Gender}
                    placeholder="성별"
                    value={userInfo.gender}
                    setValue={(value) => onChangeInput(value ?? '', 'gender')}
                  />
                  {userInfoError.gender && (
                    <span className="text-[11px] text-red-400 px-2">
                      성별을 선택해 주세요.
                    </span>
                  )}
                </div>
              </form>
              <div className="w-[264px] flex flex-col items-center gap-3 mt-[47px]">
                <Button
                  type="submit"
                  blueType="dark"
                  text="회원가입"
                  onClick={onSignUp}
                  className="h-[47px]"
                />
                <Button
                  text="돌아가기"
                  onClick={() => navigate(-1)}
                  blueType="light"
                  className="h-[47px]"
                />
              </div>
            </div>
          </section>
          {/* Ads Section */}
          <section className="w-[480px] h-[230px] bg-black rounded-2xl"></section>
        </div>
      </div>
      <Modal
        title="이메일 인증"
        isOpen={isCertifyOpen}
        onClose={onToggleCertifyModal}
        width={350}
        height={200}
      >
        <div
          className={`flex flex-col ${userInfoError.code ? 'gap-1' : 'gap-4'}`}
        >
          <div>
            <div className="relative w-full flex flex-col gap-1">
              <Input
                label="인증번호"
                value={userInfo.code}
                onChange={(event) => onChangeInput(event.target.value, 'code')}
              />
              <span className="absolute right-[16px] top-[50%] translate-y-[-50%] text-[14px] text-red-600 font-medium">
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
              </span>
            </div>
            {userInfoError.code && (
              <span className="text-[11px] text-red-400 px-2">
                인증번호가 일치하지 않습니다.
              </span>
            )}
          </div>
          <div className="flex gap-4">
            <Button
              blueType="light"
              text="재전송"
              onClick={onResendCertifyEmail}
            />
            <Button
              disabled={minutes === 0 && seconds === 0}
              blueType="dark"
              text="인증하기"
              onClick={onSendCertifyNumber}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SignUp;
