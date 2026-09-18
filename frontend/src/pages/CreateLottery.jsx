import { useState } from "react";
import "./CreateLottery.css";
import { useWeb3 } from "../context/Web3Context";

const cryptoPresets = {
  ETH: {
    name: "Ethereum",
    image:
      "https://images.unsplash.com/photo-1622630998477-20aa696ecb05?auto=format&fit=crop&w=900&q=80",
  },

  BTC: {
    name: "Bitcoin",
    image:
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80",
  },

  SOL: {
    name: "Solana",
    image:
      "https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=900&q=80",
  },
};

function CreateLottery() {
  const { contract, web3, account, isConnected, isCorrectNetwork, refreshBalance } = useWeb3();

  const [prizeName, setPrizeName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");

  const [prizeType, setPrizeType] = useState("physical");

  const [prizeValue, setPrizeValue] = useState("");
  const [prizeCurrency, setPrizeCurrency] = useState("USD");

  const [cryptoType, setCryptoType] = useState("ETH");
  const [ethAmount, setEthAmount] = useState("");

  const [entryFee, setEntryFee] = useState("");
  const [maxParticipants, setMaxParticipants] =
    useState("");

  const [organizerContact, setOrganizerContact] =
    useState("");

  const [imagePreview, setImagePreview] =
    useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState(null); // null | "waiting-metamask" | "mining" | "success" | "error"
  const [txHash, setTxHash] = useState(null);
  const [formError, setFormError] = useState(null);


  /* =========================================
     IMAGE UPLOAD
  ========================================= */

  const handleImageUpload = (event) => {

    const file = event.target.files[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {

      alert(
        "Please upload a JPG, PNG or WebP image."
      );

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {

      alert(
        "Image size must be less than 5 MB."
      );

      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.readAsDataURL(file);
  };


  /* =========================================
     RESET FORM
  ========================================= */

  const handleReset = () => {
    setPrizeName("");
    setDescription("");
    setCategory("Technology");
    setPrizeType("physical");
    setPrizeValue("");
    setPrizeCurrency("USD");
    setCryptoType("ETH");
    setEthAmount("");
    setEntryFee("");
    setMaxParticipants("");
    setOrganizerContact("");
    setImagePreview(null);
    setIsSubmitting(false);
    setTxStatus(null);
    setTxHash(null);
    setFormError(null);
  };


  /* =========================================
     PREVIEW IMAGE
  ========================================= */

  const getPreviewImage = () => {

    if (prizeType === "physical") {
      return imagePreview;
    }

    if (prizeType === "eth") {
      return cryptoPresets.ETH.image;
    }

    return cryptoPresets[cryptoType]?.image;
  };


  /* =========================================
     PREVIEW PRIZE NAME
  ========================================= */

  const getPreviewPrizeName = () => {

    if (prizeName.trim()) {
      return prizeName;
    }

    if (prizeType === "eth") {

      return ethAmount
        ? `${ethAmount} ETH`
        : "ETH Prize";
    }

    if (prizeType === "crypto") {

      return cryptoType
        ? `${cryptoType} Prize`
        : "Crypto Prize";
    }

    return "Your Prize";
  };


  /* =========================================
     PREVIEW VALUE
  ========================================= */

  const getPreviewValue = () => {

    if (prizeType === "eth") {

      return ethAmount
        ? `${ethAmount} ETH`
        : "—";
    }

    if (prizeType === "crypto") {

      return prizeValue && cryptoType
        ? `${prizeValue} ${cryptoType}`
        : "—";
    }

    return prizeValue && prizeCurrency
      ? `${prizeValue} ${prizeCurrency}`
      : "—";
  };


  /* =========================================
     PREVIEW CATEGORY
  ========================================= */

  const getPreviewCategory = () => {

    if (
      prizeType === "eth" ||
      prizeType === "crypto"
    ) {
      return "Crypto";
    }

    return category || "Category";
  };


  /* =========================================
     CREATE LOTTERY
  ========================================= */

  const handleCreateLottery = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!isConnected) {
      setFormError("Please connect your MetaMask wallet before creating a lottery.");
      return;
    }

    if (!isCorrectNetwork) {
      setFormError("Please switch your wallet to a supported network (Ganache Local 1337 or Sepolia).");
      return;
    }

    if (!contract || !web3) {
      setFormError("Smart contract is not available on this network.");
      return;
    }

    // Validations
    if (!prizeName.trim()) {
      setFormError("Prize name is required.");
      return;
    }

    if (!description.trim()) {
      setFormError("Prize description is required.");
      return;
    }

    if (!organizerContact.trim()) {
      setFormError("Organizer contact information is required.");
      return;
    }

    const feeNum = parseFloat(entryFee);
    if (isNaN(feeNum) || feeNum <= 0) {
      setFormError("Entry fee must be a valid number greater than 0 ETH.");
      return;
    }

    const maxPartsNum = parseInt(maxParticipants, 10);
    if (isNaN(maxPartsNum) || maxPartsNum <= 0) {
      setFormError("Maximum participants must be at least 1.");
      return;
    }

    // Determine prize parameters based on prizeType
    let prizeTypeEnum;
    let ethPrizeAmountWei = "0";
    let prizeValueWei;
    let txValue = "0";
    let selectedCurrency;
    let imageURI;

    if (prizeType === "eth") {
      prizeTypeEnum = 1;
      selectedCurrency = "ETH";
      const ethVal = parseFloat(ethAmount);
      if (isNaN(ethVal) || ethVal <= 0) {
        setFormError("ETH prize amount must be greater than 0.");
        return;
      }
      ethPrizeAmountWei = web3.utils.toWei(ethAmount.toString(), "ether");
      prizeValueWei = ethPrizeAmountWei;
      txValue = ethPrizeAmountWei;
      imageURI = "preset:eth";
    } else if (prizeType === "crypto") {
      prizeTypeEnum = 2;
      selectedCurrency = cryptoType || "ETH";
      const valNum = parseFloat(prizeValue);
      if (isNaN(valNum) || valNum <= 0) {
        setFormError("Simulated crypto prize value must be greater than 0.");
        return;
      }
      prizeValueWei = Math.round(valNum).toString();
      imageURI = `preset:${(cryptoType || "eth").toLowerCase()}`;
    } else {
      // Physical prize
      prizeTypeEnum = 0;
      if (prizeValue && parseFloat(prizeValue) > 0) {
        prizeValueWei = Math.round(parseFloat(prizeValue)).toString();
      } else {
        prizeValueWei = "1";
      }
      imageURI = `preset:${(category || "technology").toLowerCase()}`;
    }

    const entryFeeWei = web3.utils.toWei(entryFee.toString(), "ether");

    setIsSubmitting(true);
    setTxStatus("waiting-metamask");
    setTxHash(null);

    try {
      const txPromise = contract.methods.createLottery(
        prizeName.trim(),
        description.trim(),
        category || "Technology",
        imageURI,
        prizeTypeEnum,
        selectedCurrency,
        prizeValueWei,
        ethPrizeAmountWei,
        organizerContact.trim(),
        entryFeeWei,
        maxPartsNum
      ).send({
        from: account,
        value: txValue,
      });

      txPromise.on("transactionHash", (hash) => {
        setTxHash(hash);
        setTxStatus("mining");
      });

      const receipt = await txPromise;
      setTxHash(receipt.transactionHash);
      setTxStatus("success");
      await refreshBalance();
    } catch (err) {
      console.error("Failed to create lottery:", err);
      setTxStatus("error");
      if (err.code === 4001) {
        setFormError("Transaction was rejected in MetaMask.");
      } else if (err.message && err.message.includes("insufficient funds")) {
        setFormError("Insufficient funds in your wallet to cover the transaction value and gas fee.");
      } else {
        setFormError(err.message || "Failed to create lottery on the blockchain.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (

    <div className="create-lottery-page">


      {/* =====================================
          PAGE HEADING
      ====================================== */}

      <div className="create-page-heading">

        <div>

          <h2>
            Create a New <span>Lottery</span>
          </h2>

          <p>
            Set up your prize and lottery rules.
          </p>

        </div>

      </div>


      {/* =====================================
          MAIN LAYOUT
      ====================================== */}

      <form
        id="create-lottery-form"
        className="create-lottery-layout"
        onSubmit={handleCreateLottery}
      >


        {/* ===================================
            LEFT FORM COLUMN
        ==================================== */}

        <div className="create-form-column">


          {/* =================================
              BASIC INFORMATION
          ================================== */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-icon">
                ▣
              </div>

              <div>

                <h3>
                  Basic Information
                </h3>

                <p>
                  Tell users what they can win.
                </p>

              </div>

            </div>


            <div className="form-group">

              <label>
                Prize Name <span>*</span>
              </label>

              <input
                type="text"
                placeholder="e.g. Gaming Laptop"
                value={prizeName}
                onChange={(e) =>
                  setPrizeName(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Prize Description <span>*</span>
              </label>

              <textarea
                rows="3"
                placeholder="Describe the prize..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

            </div>


            <div className="form-two-column">


              <div className="form-group">

                <label>
                  Prize Category <span>*</span>
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value)
                  }
                  disabled={
                    prizeType === "eth" ||
                    prizeType === "crypto"
                  }
                >

                  <option value="">
                    Select Category
                  </option>

                  <option>
                    Technology
                  </option>

                  <option>
                    Gaming
                  </option>

                  <option>
                    Electronics
                  </option>

                  <option>
                    Fashion
                  </option>

                  <option>
                    Automotive
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>


              <div className="form-group">

                <label>
                  Prize Type <span>*</span>
                </label>


                <div className="radio-group">


                  <label className="radio-option">

                    <input
                      type="radio"
                      name="prizeType"
                      value="physical"
                      checked={
                        prizeType === "physical"
                      }
                      onChange={() =>
                        setPrizeType("physical")
                      }
                    />

                    <span>
                      Physical Prize
                    </span>

                  </label>


                  <label className="radio-option">

                    <input
                      type="radio"
                      name="prizeType"
                      value="eth"
                      checked={
                        prizeType === "eth"
                      }
                      onChange={() =>
                        setPrizeType("eth")
                      }
                    />

                    <span>
                      ETH Prize
                    </span>

                  </label>


                  <label className="radio-option">

                    <input
                      type="radio"
                      name="prizeType"
                      value="crypto"
                      checked={
                        prizeType === "crypto"
                      }
                      onChange={() =>
                        setPrizeType("crypto")
                      }
                    />

                    <span>
                      Other Crypto (Simulated)
                    </span>

                  </label>


                </div>

              </div>

            </div>

          </section>


          {/* =================================
              PRIZE IMAGE
          ================================== */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-icon">
                ▧
              </div>

              <div>

                <h3>
                  Prize Image
                </h3>

                <p>
                  Choose how your prize will
                  appear on lottery cards.
                </p>

              </div>

            </div>


            {prizeType === "physical" && (

              <div className="image-upload-area">

                {imagePreview ? (

                  <div className="uploaded-image-container">

                    <img
                      src={imagePreview}
                      alt="Prize preview"
                    />


                    <button
                      type="button"
                      className="remove-image"
                      onClick={() =>
                        setImagePreview(null)
                      }
                    >
                      ×
                    </button>


                    <label className="change-image">

                      Change Image

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageUpload}
                      />

                    </label>

                  </div>

                ) : (

                  <label className="upload-box">

                    <div className="upload-icon">
                      ↑
                    </div>

                    <strong>
                      Upload Prize Image
                    </strong>

                    <span>
                      Drag & drop or click to upload
                    </span>

                    <small>
                      JPG, PNG or WebP · Max 5 MB
                    </small>

                    <span className="upload-button">
                      Upload Image
                    </span>

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageUpload}
                    />

                  </label>

                )}

              </div>

            )}


            {prizeType === "eth" && (

              <div className="preset-image-card">

                <img
                  src={cryptoPresets.ETH.image}
                  alt="Ethereum preset"
                />

                <div>

                  <strong>
                    Ethereum Preset
                  </strong>

                  <span>
                    Automatically selected for
                    ETH prizes.
                  </span>

                </div>

              </div>

            )}


            {prizeType === "crypto" && (

              <>

                <div className="crypto-selector">

                  {Object.keys(
                    cryptoPresets
                  ).map((crypto) => (

                    <button
                      type="button"
                      key={crypto}
                      className={
                        cryptoType === crypto
                          ? "crypto-option active"
                          : "crypto-option"
                      }
                      onClick={() =>
                        setCryptoType(crypto)
                      }
                    >
                      {crypto}
                    </button>

                  ))}

                </div>


                <div className="preset-image-card">

                  {cryptoPresets[cryptoType] ? (

                    <>

                      <img
                        src={
                          cryptoPresets[
                            cryptoType
                          ].image
                        }
                        alt={
                          cryptoPresets[
                            cryptoType
                          ].name
                        }
                      />

                      <div>

                        <strong>
                          {
                            cryptoPresets[
                              cryptoType
                            ].name
                          }{" "}
                          Preset
                        </strong>

                        <span>
                          Predefined image ·
                          Simulated prize
                        </span>

                      </div>

                    </>

                  ) : (

                    <div>
                      <strong>
                        Select a Crypto
                      </strong>

                      <span>
                        Choose ETH, BTC or SOL.
                      </span>
                    </div>

                  )}

                </div>

              </>

            )}

          </section>


          {/* =================================
              PRIZE DETAILS
          ================================== */}

          {prizeType !== "physical" && (

            <section className="form-section">

              <div className="section-heading">

                <div className="section-icon">
                  ◇
                </div>

                <div>

                  <h3>
                    Prize Details
                  </h3>

                  <p>
                    Set the value of the prize.
                  </p>

                </div>

              </div>


              {prizeType === "eth" && (

                <div className="form-group">

                  <label>
                    ETH Prize Amount{" "}
                    <span>*</span>
                  </label>


                  <div className="input-with-unit">

                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      placeholder="1.0"
                      value={ethAmount}
                      onChange={(e) =>
                        setEthAmount(
                          e.target.value
                        )
                      }
                    />

                    <span>
                      ETH
                    </span>

                  </div>


                  <small>
                    This amount will be deposited
                    into the smart contract when
                    creating the lottery.
                  </small>

                </div>

              )}


              {prizeType === "crypto" && (

                <div className="form-group">

                  <label>
                    Simulated Prize Value{" "}
                    <span>*</span>
                  </label>


                  <div className="input-with-unit">

                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="1"
                      value={prizeValue}
                      onChange={(e) =>
                        setPrizeValue(
                          e.target.value
                        )
                      }
                    />

                    <span>
                      {cryptoType || "CRYPTO"}
                    </span>

                  </div>


                  <small>
                    This crypto prize is simulated
                    for educational purposes.
                  </small>

                </div>

              )}

            </section>

          )}


          {/* =================================
              LOTTERY RULES
          ================================== */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-icon">
                ⚙
              </div>

              <div>

                <h3>
                  Lottery Rules
                </h3>

                <p>
                  Define how users can
                  participate.
                </p>

              </div>

            </div>


            <div className="form-two-column">


              <div className="form-group">

                <label>
                  Entry Fee <span>*</span>
                </label>


                <div className="input-with-unit">

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="0.05"
                    value={entryFee}
                    onChange={(e) =>
                      setEntryFee(
                        e.target.value
                      )
                    }
                  />

                  <span>
                    ETH
                  </span>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Maximum Participants{" "}
                  <span>*</span>
                </label>

                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={maxParticipants}
                  onChange={(e) =>
                    setMaxParticipants(
                      e.target.value
                    )
                  }
                />

              </div>


            </div>


            <div className="helper-note">

              <span>ℹ</span>

              The lottery will automatically
              close when the maximum number of
              participants is reached.

            </div>

          </section>


          {/* =================================
              ORGANIZER INFORMATION
          ================================== */}

          <section className="form-section">

            <div className="section-heading">

              <div className="section-icon">
                ●
              </div>

              <div>

                <h3>
                  Organizer Information
                </h3>

                <p>
                  Provide contact information
                  for the winner.
                </p>

              </div>

            </div>


            <div className="form-group">

              <label>
                Contact Information{" "}
                <span>*</span>
              </label>

              <input
                type="text"
                placeholder="Email, Telegram, phone..."
                value={organizerContact}
                onChange={(e) =>
                  setOrganizerContact(
                    e.target.value
                  )
                }
              />

              <small>
                This contact information will
                be shown to the winner after
                the prize is claimed.
              </small>

            </div>

          </section>

        </div>


        {/* ===================================
            RIGHT SIDE
        ==================================== */}

        <aside className="create-preview-column">


          {/* =================================
              LIVE PREVIEW
          ================================== */}

          <section className="preview-section">

            <div className="section-heading">

              <div className="section-icon">
                ◉
              </div>

              <div>

                <h3>
                  Live Preview
                </h3>

                <p>
                  This is how your lottery
                  will appear on the platform.
                </p>

              </div>

            </div>


            <div className="preview-card">


              <div className="preview-image-wrapper">

                {getPreviewImage() ? (

                  <img
                    src={getPreviewImage()}
                    alt="Lottery preview"
                  />

                ) : (

                  <div className="preview-image-placeholder">

                    <span>
                      +
                    </span>

                    <small>
                      Prize Image
                    </small>

                  </div>

                )}


                <span className="preview-category">
                  {getPreviewCategory()}
                </span>


                <span className="preview-status">
                  Preview
                </span>

              </div>


              <div className="preview-card-body">

                <h3>
                  {getPreviewPrizeName()}
                </h3>


                <p>
                  {description ||
                    "Your prize description will appear here."}
                </p>


                <div className="preview-info">

                  <div>

                    <span>
                      Entry Fee
                    </span>

                    <strong>
                      {entryFee
                        ? `${entryFee} ETH`
                        : "—"}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Participants
                    </span>

                    <strong>
                      0 /{" "}
                      {maxParticipants ||
                        "—"}
                    </strong>

                  </div>

                </div>


                <div className="preview-progress">

                  <div />

                </div>

              </div>

            </div>

          </section>


          {/* =================================
              LOTTERY SUMMARY
          ================================== */}

          <section className="summary-section">

            <div className="section-heading">

              <div className="section-icon">
                ▤
              </div>

              <div>

                <h3>
                  Lottery Summary
                </h3>

                <p>
                  Review your lottery before
                  creating it.
                </p>

              </div>

            </div>


            <div className="summary-card">


              <div className="summary-row">

                <span>
                  Prize
                </span>

                <strong>
                  {getPreviewPrizeName()}
                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Prize Type
                </span>

                <strong>

                  {prizeType === "physical"
                    ? "Physical Prize"
                    : prizeType === "eth"
                    ? "ETH Prize"
                    : prizeType === "crypto"
                    ? "Other Crypto (Simulated)"
                    : "—"}

                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Prize Value
                </span>

                <strong>
                  {getPreviewValue()}
                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Entry Fee
                </span>

                <strong>
                  {entryFee
                    ? `${entryFee} ETH`
                    : "—"}
                </strong>

              </div>


              <div className="summary-row">

                <span>
                  Maximum Participants
                </span>

                <strong>
                  {maxParticipants || "—"}
                </strong>

              </div>


            </div>


            <div className="wallet-notice">

              <span>
                ⓘ
              </span>

              <p>
                Your wallet will be used to
                create this lottery. You will
                be asked to confirm the
                transaction in MetaMask.
              </p>

            </div>

          </section>

        </aside>

      </form>

      {/* Transaction Feedback Banner */}
      {txStatus && (
        <div className={`tx-status-card ${txStatus}`} style={{ maxWidth: "1200px", margin: "20px auto 0" }}>
          {txStatus === "waiting-metamask" && (
            <div>
              <span className="tx-spinner"></span>
              <strong>Waiting for MetaMask confirmation...</strong>
              <p style={{ margin: "4px 0 0", color: "#c8c8c8" }}>
                Please approve the transaction in your MetaMask wallet.
              </p>
            </div>
          )}
          {txStatus === "mining" && (
            <div>
              <span className="tx-spinner"></span>
              <strong>Transaction is being mined on the blockchain...</strong>
              <p style={{ margin: "4px 0 0" }}>
                Tx Hash: <code>{txHash}</code>
              </p>
            </div>
          )}
          {txStatus === "success" && (
            <div>
              <strong style={{ fontSize: "16px" }}>
                ✓ Lottery Successfully Created on Blockchain!
              </strong>
              <p style={{ margin: "4px 0 0" }}>
                Your lottery is now live and participants can enter.
              </p>
              <p style={{ margin: "4px 0 0" }}>
                Tx Hash: <code>{txHash}</code>
              </p>
            </div>
          )}
          {txStatus === "error" && formError && (
            <div>
              <strong>⚠️ Creation Failed</strong>
              <p style={{ margin: "4px 0 0" }}>{formError}</p>
            </div>
          )}
        </div>
      )}

      {/* Form Error Banner */}
      {formError && txStatus !== "error" && (
        <div className="tx-status-card error" style={{ maxWidth: "1200px", margin: "20px auto 0" }}>
          <strong>⚠️ Validation Error</strong>
          <p style={{ margin: "4px 0 0" }}>{formError}</p>
        </div>
      )}

      {/* =====================================
          BOTTOM ACTIONS
      ====================================== */}

      <div className="create-actions">

        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </button>


        <button
          type="submit"
          form="create-lottery-form"
          className="create-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="tx-spinner"></span>
              <span>{txStatus === "mining" ? "Mining Tx..." : "Confirming..."}</span>
            </>
          ) : (
            <>
              Create Lottery
              <span>→</span>
            </>
          )}
        </button>

      </div>

    </div>
  );
}

export default CreateLottery;