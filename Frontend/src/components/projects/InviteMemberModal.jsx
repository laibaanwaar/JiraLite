import {
  useEffect,
  useState,
} from "react";

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const InviteMemberModal = ({
  isOpen,
  onClose,
  onInvite,
  isInviting = false,
}) => {
  const [inputValue, setInputValue] =
    useState("");

  const [emails, setEmails] =
    useState([]);

  const [validationError, setValidationError] =
    useState("");

  const [
    failedInvitations,
    setFailedInvitations,
  ] = useState([]);

  // ==========================================
  // RESET MODAL
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setInputValue("");
    setEmails([]);
    setValidationError("");
    setFailedInvitations([]);
  }, [isOpen]);

  // ==========================================
  // ESCAPE KEY + BODY SCROLL
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !isInviting
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, [isOpen, isInviting, onClose]);

  if (!isOpen) {
    return null;
  }

  // ==========================================
  // NORMALIZE EMAIL
  // ==========================================

  const normalizeEmail = (email) => {
    return String(email)
      .trim()
      .toLowerCase();
  };

  // ==========================================
  // ADD MULTIPLE EMAILS
  // ==========================================

  const addEmails = (rawValue) => {
    const candidates = String(
      rawValue,
    )
      .split(/[\s,;]+/)
      .map(normalizeEmail)
      .filter(Boolean);

    if (candidates.length === 0) {
      return false;
    }

    const invalidEmail =
      candidates.find(
        (email) =>
          !EMAIL_REGEX.test(email),
      );

    if (invalidEmail) {
      setValidationError(
        `${invalidEmail} is not a valid email address.`,
      );

      return false;
    }

    setEmails((previous) => [
      ...new Set([
        ...previous,
        ...candidates,
      ]),
    ]);

    setInputValue("");
    setValidationError("");
    setFailedInvitations([]);

    return true;
  };

  // ==========================================
  // KEYBOARD INPUT
  // ==========================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" ||
      event.key === "," ||
      event.key === ";"
    ) {
      event.preventDefault();

      if (inputValue.trim()) {
        addEmails(inputValue);
      }
    }

    if (
      event.key === "Backspace" &&
      !inputValue &&
      emails.length > 0
    ) {
      setEmails((previous) =>
        previous.slice(0, -1),
      );
    }
  };

  // ==========================================
  // PASTE MULTIPLE EMAILS
  // ==========================================

  const handlePaste = (event) => {
    const pastedValue =
      event.clipboardData.getData(
        "text",
      );

    if (
      pastedValue.includes(",") ||
      pastedValue.includes(";") ||
      pastedValue.includes("\n") ||
      pastedValue.includes(" ")
    ) {
      event.preventDefault();
      addEmails(pastedValue);
    }
  };

  // ==========================================
  // REMOVE EMAIL
  // ==========================================

  const removeEmail = (
    emailToRemove,
  ) => {
    setEmails((previous) =>
      previous.filter(
        (email) =>
          email !== emailToRemove,
      ),
    );

    setValidationError("");
    setFailedInvitations([]);
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const handleClose = () => {
    if (isInviting) {
      return;
    }

    setInputValue("");
    setEmails([]);
    setValidationError("");
    setFailedInvitations([]);
    onClose();
  };

  // ==========================================
  // SEND INVITATIONS
  // ==========================================

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    setValidationError("");
    setFailedInvitations([]);

    let finalEmails = [...emails];

    if (inputValue.trim()) {
      const currentValues =
        inputValue
          .split(/[\s,;]+/)
          .map(normalizeEmail)
          .filter(Boolean);

      const invalidEmail =
        currentValues.find(
          (email) =>
            !EMAIL_REGEX.test(
              email,
            ),
        );

      if (invalidEmail) {
        setValidationError(
          `${invalidEmail} is not a valid email address.`,
        );

        return;
      }

      finalEmails = [
        ...new Set([
          ...finalEmails,
          ...currentValues,
        ]),
      ];
    }

    if (finalEmails.length === 0) {
      setValidationError(
        "Please add at least one email address.",
      );

      return;
    }

    if (typeof onInvite !== "function") {
      setValidationError(
        "Invitation handler is not available.",
      );

      return;
    }

    const response =
      await onInvite(finalEmails);

    if (!response) {
      return;
    }

    const invited =
      Array.isArray(
        response?.data?.invited,
      )
        ? response.data.invited
        : [];

    const failed =
      Array.isArray(
        response?.data?.failed,
      )
        ? response.data.failed
        : [];

    // All invitations succeeded
    if (
      invited.length > 0 &&
      failed.length === 0
    ) {
      setInputValue("");
      setEmails([]);
      setFailedInvitations([]);
      onClose();

      return;
    }

    // Partial success or complete failure
    setFailedInvitations(failed);

    const failedEmails = failed
      .map((item) =>
        normalizeEmail(
          item?.email,
        ),
      )
      .filter(Boolean);

    setEmails(failedEmails);
    setInputValue("");
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[200]
        overflow-y-auto
        bg-[#0F1E33]/55
        px-4
        py-5
        backdrop-blur-[2px]
      "
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="
            relative
            max-h-[calc(100vh-40px)]
            w-full
            max-w-[650px]
            overflow-y-auto
            rounded-[22px]
            bg-white
            p-6
            shadow-[0_30px_90px_rgba(15,30,51,0.28)]
            sm:p-8
          "
        >
          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={handleClose}
            disabled={isInviting}
            aria-label="Close invite members modal"
            className="
              absolute
              right-5
              top-4
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-2xl
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-[#14223A]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>

          {/* HEADER */}

          <div className="pr-10">
            <h2 className="text-2xl font-black text-[#14223A]">
              Invite team members
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Invite existing registered
              users to join this project.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-7"
          >
            <label
              htmlFor="member-emails"
              className="mb-2 block text-sm font-bold text-[#14223A]"
            >
              Email addresses
            </label>

            {/* EMAIL CHIP INPUT */}

            <div
              className="
                min-h-[110px]
                rounded-xl
                border
                border-slate-300
                bg-slate-50
                p-3
                transition
                focus-within:border-[#3563E9]
                focus-within:bg-white
                focus-within:ring-4
                focus-within:ring-[#3563E9]/10
              "
            >
              {emails.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {emails.map((email) => (
                    <span
                      key={email}
                      className="
                        inline-flex
                        max-w-full
                        items-center
                        gap-2
                        rounded-lg
                        bg-indigo-50
                        px-3
                        py-1.5
                        text-xs
                        font-bold
                        text-[#3563E9]
                      "
                    >
                      <span className="truncate">
                        {email}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeEmail(
                            email,
                          )
                        }
                        disabled={
                          isInviting
                        }
                        aria-label={`Remove ${email}`}
                        className="shrink-0 text-base leading-none text-slate-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <input
                id="member-emails"
                type="text"
                inputMode="email"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(
                    event.target.value,
                  );

                  setValidationError("");
                  setFailedInvitations([]);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isInviting}
                placeholder="teammate@example.com"
                autoFocus
                className="
                  w-full
                  border-0
                  bg-transparent
                  px-1
                  py-2
                  text-base
                  text-[#14223A]
                  outline-none
                  placeholder:text-slate-400
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              Press Enter, comma, or
              semicolon after each email.
              Multiple emails can also be
              pasted together.
            </p>

            {emails.length > 0 && (
              <p className="mt-2 text-xs font-bold text-[#3563E9]">
                {emails.length}{" "}
                {emails.length === 1
                  ? "person is"
                  : "people are"}{" "}
                ready to invite
              </p>
            )}

            {/* VALIDATION ERROR */}

            {validationError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {validationError}
              </div>
            )}

            {/* FAILED EMAIL RESULTS */}

            {failedInvitations.length >
              0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-800">
                  Some invitations could
                  not be sent:
                </p>

                <div className="mt-3 space-y-2">
                  {failedInvitations.map(
                    (item, index) => (
                      <div
                        key={`${item?.email}-${index}`}
                        className="rounded-lg bg-white/70 px-3 py-2 text-xs text-amber-800"
                      >
                        <p className="font-bold">
                          {item?.email}
                        </p>

                        <p className="mt-1">
                          {item?.reason ||
                            "Invitation failed."}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={isInviting}
                className="
                  w-full
                  rounded-xl
                  bg-[#3563E9]
                  py-3.5
                  font-extrabold
                  text-white
                  shadow-[0_8px_22px_rgba(53,99,233,0.25)]
                  transition
                  hover:bg-[#2F58D3]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isInviting
                  ? "Sending invitations..."
                  : "Send invitations"}
              </button>

              <button
                type="button"
                onClick={handleClose}
                disabled={isInviting}
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  py-3.5
                  font-bold
                  text-[#14223A]
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberModal;