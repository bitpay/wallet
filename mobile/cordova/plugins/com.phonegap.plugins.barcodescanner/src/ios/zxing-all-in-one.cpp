
#include "zxing-all-in-one.h"

// file: zxing/BarcodeFormat.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/BarcodeFormat.h>

namespace zxing {

const char *barcodeFormatNames[] = {
    "None",
    "QR_CODE",
    "DATA_MATRIX",
    "UPC_E",
    "UPC_A",
    "EAN_8",
    "EAN_13",
    "CODE_128",
    "CODE_39",
    "ITF"
};

}

// file: zxing/Binarizer.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Binarizer.cpp
 *  zxing
 *
 *  Created by Ralf Kistner on 16/10/2009.
 *  Copyright 2008 ZXing authors All rights reserved.
 *  Modified by Lukasz Warchol on 02/02/2010.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/Binarizer.h>

namespace zxing {

	Binarizer::Binarizer(Ref<LuminanceSource> source) : source_(source) {
  }

	Binarizer::~Binarizer() {
	}

	Ref<LuminanceSource> Binarizer::getLuminanceSource() const {
		return source_;
	}

}

// file: zxing/BinaryBitmap.cpp

/*
 *  BinaryBitmap.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/BinaryBitmap.h>

namespace zxing {

	BinaryBitmap::BinaryBitmap(Ref<Binarizer> binarizer) : binarizer_(binarizer) {

	}

	BinaryBitmap::~BinaryBitmap() {
	}

	Ref<BitArray> BinaryBitmap::getBlackRow(int y, Ref<BitArray> row) {
		return binarizer_->getBlackRow(y, row);
	}

	Ref<BitMatrix> BinaryBitmap::getBlackMatrix() {
		return binarizer_->getBlackMatrix();
	}

	int BinaryBitmap::getWidth() const {
		return getLuminanceSource()->getWidth();
	}

	int BinaryBitmap::getHeight() const {
		return getLuminanceSource()->getHeight();
	}

	Ref<LuminanceSource> BinaryBitmap::getLuminanceSource() const {
		return binarizer_->getLuminanceSource();
	}


	bool BinaryBitmap::isCropSupported() const {
	  return getLuminanceSource()->isCropSupported();
	}

	Ref<BinaryBitmap> BinaryBitmap::crop(int left, int top, int width, int height) {
	  return Ref<BinaryBitmap> (new BinaryBitmap(binarizer_->createBinarizer(getLuminanceSource()->crop(left, top, width, height))));
	}

	bool BinaryBitmap::isRotateSupported() const {
	  return getLuminanceSource()->isRotateSupported();
	}

	Ref<BinaryBitmap> BinaryBitmap::rotateCounterClockwise() {
	  return Ref<BinaryBitmap> (new BinaryBitmap(binarizer_->createBinarizer(getLuminanceSource()->rotateCounterClockwise())));
	}
}

// file: zxing/DecodeHints.cpp

/*
 *  DecodeHintType.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/DecodeHints.h>
// #include <zxing/common/IllegalArgumentException.h>
namespace zxing {

const DecodeHintType DecodeHints::CHARACTER_SET;

const DecodeHints DecodeHints::PRODUCT_HINT(
    BARCODEFORMAT_UPC_E_HINT |
    BARCODEFORMAT_UPC_A_HINT |
    BARCODEFORMAT_EAN_8_HINT |
    BARCODEFORMAT_EAN_13_HINT);

const DecodeHints DecodeHints::ONED_HINT(
    BARCODEFORMAT_UPC_E_HINT |
    BARCODEFORMAT_UPC_A_HINT |
    BARCODEFORMAT_EAN_8_HINT |
    BARCODEFORMAT_EAN_13_HINT |
    BARCODEFORMAT_CODE_128_HINT |
    BARCODEFORMAT_CODE_39_HINT |
    BARCODEFORMAT_ITF_HINT);

const DecodeHints DecodeHints::DEFAULT_HINT(
    BARCODEFORMAT_UPC_E_HINT |
    BARCODEFORMAT_UPC_A_HINT |
    BARCODEFORMAT_EAN_8_HINT |
    BARCODEFORMAT_EAN_13_HINT |
    BARCODEFORMAT_CODE_128_HINT |
    BARCODEFORMAT_CODE_39_HINT |
    BARCODEFORMAT_ITF_HINT |
    BARCODEFORMAT_DATA_MATRIX_HINT |
    BARCODEFORMAT_QR_CODE_HINT);

DecodeHints::DecodeHints() {
  hints = 0;
}

DecodeHints::DecodeHints(DecodeHintType init) {
  hints = init;
}

void DecodeHints::addFormat(BarcodeFormat toadd) {
  switch (toadd) {
    case BarcodeFormat_QR_CODE: hints |= BARCODEFORMAT_QR_CODE_HINT; break;
    case BarcodeFormat_DATA_MATRIX: hints |= BARCODEFORMAT_DATA_MATRIX_HINT; break;
    case BarcodeFormat_UPC_E: hints |= BARCODEFORMAT_UPC_E_HINT; break;
    case BarcodeFormat_UPC_A: hints |= BARCODEFORMAT_UPC_A_HINT; break;
    case BarcodeFormat_EAN_8: hints |= BARCODEFORMAT_EAN_8_HINT; break;
    case BarcodeFormat_EAN_13: hints |= BARCODEFORMAT_EAN_13_HINT; break;
    case BarcodeFormat_CODE_128: hints |= BARCODEFORMAT_CODE_128_HINT; break;
    case BarcodeFormat_CODE_39: hints |= BARCODEFORMAT_CODE_39_HINT; break;
    case BarcodeFormat_ITF: hints |= BARCODEFORMAT_ITF_HINT; break;
    default: throw IllegalArgumentException("Unrecognizd barcode format");
  }
}

bool DecodeHints::containsFormat(BarcodeFormat tocheck) const {
  DecodeHintType checkAgainst;
  switch (tocheck) {
    case BarcodeFormat_QR_CODE: checkAgainst = BARCODEFORMAT_QR_CODE_HINT; break;
    case BarcodeFormat_DATA_MATRIX: checkAgainst = BARCODEFORMAT_DATA_MATRIX_HINT; break;
    case BarcodeFormat_UPC_E: checkAgainst = BARCODEFORMAT_UPC_E_HINT; break;
    case BarcodeFormat_UPC_A: checkAgainst = BARCODEFORMAT_UPC_A_HINT; break;
    case BarcodeFormat_EAN_8: checkAgainst = BARCODEFORMAT_EAN_8_HINT; break;
    case BarcodeFormat_EAN_13: checkAgainst = BARCODEFORMAT_EAN_13_HINT; break;
    case BarcodeFormat_CODE_128: checkAgainst = BARCODEFORMAT_CODE_128_HINT; break;
    case BarcodeFormat_CODE_39: checkAgainst = BARCODEFORMAT_CODE_39_HINT; break;
    case BarcodeFormat_ITF: checkAgainst = BARCODEFORMAT_ITF_HINT; break;
    default: throw IllegalArgumentException("Unrecognizd barcode format");
  }
  return (hints & checkAgainst);
}

void DecodeHints::setTryHarder(bool toset) {
  if (toset) {
    hints |= TRYHARDER_HINT;
  } else {
    hints &= ~TRYHARDER_HINT;
  }
}

bool DecodeHints::getTryHarder() const {
  return (hints & TRYHARDER_HINT);
}

void DecodeHints::setResultPointCallback(Ref<ResultPointCallback> const& _callback) {
    callback = _callback;
}

Ref<ResultPointCallback> DecodeHints::getResultPointCallback() const {
    return callback;
}

} /* namespace */

// file: zxing/Exception.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Exception.cpp
 *  ZXing
 *
 *  Created by Christian Brunschen on 03/06/2008.
 *  Copyright 2008-2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.

 */

// #include <zxing/Exception.h>

namespace zxing {

Exception::Exception() {}

Exception::Exception(const char *msg) :
    message(msg) {
}

const char* Exception::what() const throw() {
  return message.c_str();
}

Exception::~Exception() throw() {
}

}

// file: zxing/FormatException.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  FormatException.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/FormatException.h>

namespace zxing {

FormatException::FormatException() {}

FormatException::FormatException(const char *msg) :
    ReaderException(msg) {
}

FormatException::~FormatException() throw() {
}

}

// file: zxing/LuminanceSource.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  LuminanceSource.cpp
 *  zxing
 *
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <sstream>
// #include <zxing/LuminanceSource.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {

LuminanceSource::LuminanceSource() {
}

LuminanceSource::~LuminanceSource() {
}

bool LuminanceSource::isCropSupported() const {
  return false;
}

Ref<LuminanceSource> LuminanceSource::crop(int left, int top, int width, int height) {
  (void)left;
  (void)top;
  (void)width;
  (void)height;
  throw IllegalArgumentException("This luminance source does not support cropping.");
}

bool LuminanceSource::isRotateSupported() const {
  return false;
}

Ref<LuminanceSource> LuminanceSource::rotateCounterClockwise() {
  throw IllegalArgumentException("This luminance source does not support rotation.");
}

LuminanceSource::operator std::string() {
  unsigned char* row = 0;
  std::ostringstream oss;
  for (int y = 0; y < getHeight(); y++) {
    row = getRow(y, row);
    for (int x = 0; x < getWidth(); x++) {
      int luminance = row[x] & 0xFF;
      char c;
      if (luminance < 0x40) {
        c = '#';
      } else if (luminance < 0x80) {
        c = '+';
      } else if (luminance < 0xC0) {
        c = '.';
      } else {
        c = ' ';
      }
      oss << c;
    }
    oss << '\n';
  }
  delete [] row;
  return oss.str();
}



}

// file: zxing/MultiFormatReader.cpp

/*
 *  MultiFormatBarcodeReader.cpp
 *  ZXing
 *
 *  Created by Lukasz Warchol on 10-01-26.
 *  Modified by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/MultiFormatReader.h>
// #include <zxing/qrcode/QRCodeReader.h>
// #include <zxing/datamatrix/DataMatrixReader.h>
// #include <zxing/oned/MultiFormatUPCEANReader.h>
// #include <zxing/oned/MultiFormatOneDReader.h>
// #include <zxing/ReaderException.h>

namespace zxing {
  MultiFormatReader::MultiFormatReader() {

  }

  Ref<Result> MultiFormatReader::decode(Ref<BinaryBitmap> image) {
    setHints(DecodeHints::DEFAULT_HINT);
    return decodeInternal(image);
  }

  Ref<Result> MultiFormatReader::decode(Ref<BinaryBitmap> image, DecodeHints hints) {
    setHints(hints);
    return decodeInternal(image);
  }

  Ref<Result> MultiFormatReader::decodeWithState(Ref<BinaryBitmap> image) {
    // Make sure to set up the default state so we don't crash
    if (readers_.size() == 0) {
      setHints(DecodeHints::DEFAULT_HINT);
    }
    return decodeInternal(image);
  }

  void MultiFormatReader::setHints(DecodeHints hints) {
    hints_ = hints;
    readers_.clear();
    bool tryHarder = hints.getTryHarder();

    bool addOneDReader = hints.containsFormat(BarcodeFormat_UPC_E) ||
                         hints.containsFormat(BarcodeFormat_UPC_A) ||
                         hints.containsFormat(BarcodeFormat_EAN_8) ||
                         hints.containsFormat(BarcodeFormat_EAN_13) ||
                         hints.containsFormat(BarcodeFormat_CODE_128) ||
                         hints.containsFormat(BarcodeFormat_CODE_39) ||
                         hints.containsFormat(BarcodeFormat_ITF);
    if (addOneDReader && !tryHarder) {
      readers_.push_back(Ref<Reader>(new zxing::oned::MultiFormatOneDReader(hints)));
    }
    if (hints.containsFormat(BarcodeFormat_QR_CODE)) {
      readers_.push_back(Ref<Reader>(new zxing::qrcode::QRCodeReader()));
    }
    if (hints.containsFormat(BarcodeFormat_DATA_MATRIX)) {
      readers_.push_back(Ref<Reader>(new zxing::datamatrix::DataMatrixReader()));
    }
    //TODO: add PDF417 here once PDF417 reader is implemented
    if (addOneDReader && tryHarder) {
      readers_.push_back(Ref<Reader>(new zxing::oned::MultiFormatOneDReader(hints)));
    }
    if (readers_.size() == 0) {
      if (!tryHarder) {
        readers_.push_back(Ref<Reader>(new zxing::oned::MultiFormatOneDReader(hints)));
      }
      readers_.push_back(Ref<Reader>(new zxing::qrcode::QRCodeReader()));
      if (tryHarder) {
        readers_.push_back(Ref<Reader>(new zxing::oned::MultiFormatOneDReader(hints)));
      }
    }
  }

  Ref<Result> MultiFormatReader::decodeInternal(Ref<BinaryBitmap> image) {
    for (unsigned int i = 0; i < readers_.size(); i++) {
      try {
        return readers_[i]->decode(image, hints_);
      } catch (ReaderException const& re) {
        // continue
      }
    }
    throw ReaderException("No code detected");
  }

  MultiFormatReader::~MultiFormatReader() {

  }
}

// file: zxing/NotFoundException.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 * Copyright 20011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/NotFoundException.h>

namespace zxing {

  NotFoundException::NotFoundException(const char *msg)
    : ReaderException(msg) {}

  NotFoundException::~NotFoundException() throw() {
  }

}

// file: zxing/Reader.cpp

/*
 *  Reader.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/Reader.h>

namespace zxing {

Reader::~Reader() { }

Ref<Result> Reader::decode(Ref<BinaryBitmap> image) {
  return decode(image, DecodeHints::DEFAULT_HINT);
}

}

// file: zxing/ReaderException.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  ReaderException.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008-2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/ReaderException.h>

namespace zxing {

ReaderException::ReaderException() {}

ReaderException::ReaderException(const char *msg) :
    Exception(msg) {
}

ReaderException::~ReaderException() throw() {
}

}

// file: zxing/Result.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Result.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/Result.h>

namespace zxing {
using namespace std;

Result::Result(Ref<String> text, ArrayRef<unsigned char> rawBytes, std::vector<Ref<ResultPoint> > resultPoints,
               BarcodeFormat format) :
  text_(text), rawBytes_(rawBytes), resultPoints_(resultPoints), format_(format) {
}

Result::~Result() {
}

Ref<String> Result::getText() {
  return text_;
}

ArrayRef<unsigned char> Result::getRawBytes() {
  return rawBytes_;
}

const std::vector<Ref<ResultPoint> >& Result::getResultPoints() const {
  return resultPoints_;
}

std::vector<Ref<ResultPoint> >& Result::getResultPoints() {
  return resultPoints_;
}

BarcodeFormat Result::getBarcodeFormat() const {
  return format_;
}

ostream& operator<<(ostream &out, Result& result) {
  if (result.text_ != 0) {
    out << result.text_->getText();
  } else {
    out << "[" << result.rawBytes_->size() << " bytes]";
  }
  return out;
}

}

// file: zxing/ResultPoint.cpp

/*
 *  ResultPoint.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/ResultPoint.h>
// #include <math.h>

namespace zxing {

ResultPoint::ResultPoint() : posX_(0), posY_(0) {}

ResultPoint::ResultPoint(float x, float y) : posX_(x), posY_(y) {}

ResultPoint::~ResultPoint() {}

float ResultPoint::getX() const {
  return posX_;
}

float ResultPoint::getY() const {
  return posY_;
}

bool ResultPoint::equals(Ref<ResultPoint> other) {
  return posX_ == other->getX() && posY_ == other->getY();
}

/**
 * <p>Orders an array of three ResultPoints in an order [A,B,C] such that AB < AC and
 * BC < AC and the angle between BC and BA is less than 180 degrees.
 */
void ResultPoint::orderBestPatterns(std::vector<Ref<ResultPoint> > &patterns) {
    // Find distances between pattern centers
    float zeroOneDistance = distance(patterns[0]->getX(), patterns[1]->getX(),patterns[0]->getY(), patterns[1]->getY());
    float oneTwoDistance = distance(patterns[1]->getX(), patterns[2]->getX(),patterns[1]->getY(), patterns[2]->getY());
    float zeroTwoDistance = distance(patterns[0]->getX(), patterns[2]->getX(),patterns[0]->getY(), patterns[2]->getY());

    Ref<ResultPoint> pointA, pointB, pointC;
    // Assume one closest to other two is B; A and C will just be guesses at first
    if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance) {
      pointB = patterns[0];
      pointA = patterns[1];
      pointC = patterns[2];
    } else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance) {
      pointB = patterns[1];
      pointA = patterns[0];
      pointC = patterns[2];
    } else {
      pointB = patterns[2];
      pointA = patterns[0];
      pointC = patterns[1];
    }

    // Use cross product to figure out whether A and C are correct or flipped.
    // This asks whether BC x BA has a positive z component, which is the arrangement
    // we want for A, B, C. If it's negative, then we've got it flipped around and
    // should swap A and C.
    if (crossProductZ(pointA, pointB, pointC) < 0.0f) {
      Ref<ResultPoint> temp = pointA;
      pointA = pointC;
      pointC = temp;
    }

    patterns[0] = pointA;
    patterns[1] = pointB;
    patterns[2] = pointC;
}

float ResultPoint::distance(Ref<ResultPoint> point1, Ref<ResultPoint> point2) {
  return distance(point1->getX(), point1->getY(), point2->getX(), point2->getY());
}

float ResultPoint::distance(float x1, float x2, float y1, float y2) {
  float xDiff = x1 - x2;
  float yDiff = y1 - y2;
  return (float) sqrt((double) (xDiff * xDiff + yDiff * yDiff));
}

float ResultPoint::crossProductZ(Ref<ResultPoint> pointA, Ref<ResultPoint> pointB, Ref<ResultPoint> pointC) {
  float bX = pointB->getX();
  float bY = pointB->getY();
  return ((pointC->getX() - bX) * (pointA->getY() - bY)) - ((pointC->getY() - bY) * (pointA->getX() - bX));
}
}

// file: zxing/ResultPointCallback.cpp

/*
 *  ResultPointCallback.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/ResultPointCallback.h>

namespace zxing {

ResultPointCallback::~ResultPointCallback() {}

}

// file: zxing/common/Array.cpp

/*
 *  Array.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 07/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/Array.h>


// file: zxing/common/BitArray.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/BitArray.h>

using namespace std;

namespace zxing {


size_t BitArray::wordsForBits(size_t bits) {
  int arraySize = (bits + bitsPerWord_ - 1) >> logBits_;
  return arraySize;
}

BitArray::BitArray(size_t size) :
    size_(size), bits_(wordsForBits(size), (const unsigned int)0) {
}

BitArray::~BitArray() {
}

size_t BitArray::getSize() {
  return size_;
}

void BitArray::setBulk(size_t i, unsigned int newBits) {
  bits_[i >> logBits_] = newBits;
}

void BitArray::setRange(int start, int end) {
  if (end < start) {
    throw IllegalArgumentException("invalid call to BitArray::setRange");
  }
  if (end == start) {
    return;
  }
  end--; // will be easier to treat this as the last actually set bit -- inclusive
  int firstInt = start >> 5;
  int lastInt = end >> 5;
  for (int i = firstInt; i <= lastInt; i++) {
    int firstBit = i > firstInt ? 0 : start & 0x1F;
    int lastBit = i < lastInt ? 31 : end & 0x1F;
    int mask;
    if (firstBit == 0 && lastBit == 31) {
      mask = -1;
    } else {
      mask = 0;
      for (int j = firstBit; j <= lastBit; j++) {
        mask |= 1 << j;
      }
    }
    bits_[i] |= mask;
  }
}

void BitArray::clear() {
  size_t max = bits_.size();
  for (size_t i = 0; i < max; i++) {
    bits_[i] = 0;
  }
}

bool BitArray::isRange(size_t start, size_t end, bool value) {
  if (end < start) {
    throw IllegalArgumentException("end must be after start");
  }
  if (end == start) {
    return true;
  }
  // treat the 'end' as inclusive, rather than exclusive
  end--;
  size_t firstWord = start >> logBits_;
  size_t lastWord = end >> logBits_;
  for (size_t i = firstWord; i <= lastWord; i++) {
    size_t firstBit = i > firstWord ? 0 : start & bitsMask_;
    size_t lastBit = i < lastWord ? bitsPerWord_ - 1: end & bitsMask_;
    unsigned int mask;
    if (firstBit == 0 && lastBit == bitsPerWord_ - 1) {
      mask = numeric_limits<unsigned int>::max();
    } else {
      mask = 0;
      for (size_t j = firstBit; j <= lastBit; j++) {
        mask |= 1 << j;
      }
    }
    if (value) {
      if ((bits_[i] & mask) != mask) {
        return false;
      }
    } else {
      if ((bits_[i] & mask) != 0) {
        return false;
      }
    }
  }
  return true;
}

vector<unsigned int>& BitArray::getBitArray() {
  return bits_;
}

void BitArray::reverse() {
  std::vector<unsigned int> newBits(bits_.size(),(const unsigned int) 0);
  for (size_t i = 0; i < size_; i++) {
    if (get(size_ - i - 1)) {
      newBits[i >> logBits_] |= 1<< (i & bitsMask_);
    }
  }
  bits_ = newBits;
}
}

// file: zxing/common/BitMatrix.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/IllegalArgumentException.h>

// #include <iostream>
// #include <sstream>
// #include <string>

using std::ostream;
using std::ostringstream;

using zxing::BitMatrix;
using zxing::BitArray;
using zxing::Ref;

namespace {
  size_t wordsForSize(size_t width,
                      size_t height,
                      unsigned int bitsPerWord,
                      unsigned int logBits) {
    size_t bits = width * height;
    int arraySize = (bits + bitsPerWord - 1) >> logBits;
    return arraySize;
  }
}

BitMatrix::BitMatrix(size_t dimension) :
  width_(dimension), height_(dimension), words_(0), bits_(NULL) {
  words_ = wordsForSize(width_, height_, bitsPerWord, logBits);
  bits_ = new unsigned int[words_];
  clear();
}

BitMatrix::BitMatrix(size_t width, size_t height) :
  width_(width), height_(height), words_(0), bits_(NULL) {
  words_ = wordsForSize(width_, height_, bitsPerWord, logBits);
  bits_ = new unsigned int[words_];
  clear();
}

BitMatrix::~BitMatrix() {
  delete[] bits_;
}


void BitMatrix::flip(size_t x, size_t y) {
  size_t offset = x + width_ * y;
  bits_[offset >> logBits] ^= 1 << (offset & bitsMask);
}

void BitMatrix::clear() {
  std::fill(bits_, bits_+words_, 0);
}

void BitMatrix::setRegion(size_t left, size_t top, size_t width, size_t height) {
  if ((long)top < 0 || (long)left < 0) {
    throw IllegalArgumentException("topI and leftJ must be nonnegative");
  }
  if (height < 1 || width < 1) {
    throw IllegalArgumentException("height and width must be at least 1");
  }
  size_t right = left + width;
  size_t bottom = top + height;
  if (right > width_ || bottom > height_) {
    throw IllegalArgumentException("top + height and left + width must be <= matrix dimension");
  }
  for (size_t y = top; y < bottom; y++) {
    int yOffset = width_ * y;
    for (size_t x = left; x < right; x++) {
      size_t offset = x + yOffset;
      bits_[offset >> logBits] |= 1 << (offset & bitsMask);
    }
  }
}

Ref<BitArray> BitMatrix::getRow(int y, Ref<BitArray> row) {
  if (row.empty() || row->getSize() < width_) {
    row = new BitArray(width_);
  } else {
    row->clear();
  }
  size_t start = y * width_;
  size_t end = start + width_ - 1; // end is inclusive
  size_t firstWord = start >> logBits;
  size_t lastWord = end >> logBits;
  size_t bitOffset = start & bitsMask;
  for (size_t i = firstWord; i <= lastWord; i++) {
    size_t firstBit = i > firstWord ? 0 : start & bitsMask;
    size_t lastBit = i < lastWord ? bitsPerWord - 1 : end & bitsMask;
    unsigned int mask;
    if (firstBit == 0 && lastBit == logBits) {
      mask = std::numeric_limits<unsigned int>::max();
    } else {
      mask = 0;
      for (size_t j = firstBit; j <= lastBit; j++) {
        mask |= 1 << j;
      }
    }
    row->setBulk((i - firstWord) << logBits, (bits_[i] & mask) >> bitOffset);
    if (firstBit == 0 && bitOffset != 0) {
      unsigned int prevBulk = row->getBitArray()[i - firstWord - 1];
      prevBulk |= (bits_[i] & mask) << (bitsPerWord - bitOffset);
      row->setBulk((i - firstWord - 1) << logBits, prevBulk);
    }
  }
  return row;
}

size_t BitMatrix::getWidth() const {
  return width_;
}

size_t BitMatrix::getHeight() const {
  return height_;
}

size_t BitMatrix::getDimension() const {
  return width_;
}

unsigned int* BitMatrix::getBits() const {
  return bits_;
}

namespace zxing {
  ostream& operator<<(ostream &out, const BitMatrix &bm) {
    for (size_t y = 0; y < bm.height_; y++) {
      for (size_t x = 0; x < bm.width_; x++) {
        out << (bm.get(x, y) ? "X " : "  ");
      }
      out << "\n";
    }
    return out;
  }
}

const char* BitMatrix::description() {
  ostringstream out;
  out << *this;
  return out.str().c_str();
}

// file: zxing/common/BitSource.cpp

/*
 *  BitSource.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 09/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/BitSource.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {

int BitSource::readBits(int numBits) {
  if (numBits < 0 || numBits > 32) {
    throw IllegalArgumentException("cannot read <1 or >32 bits");
  } else if (numBits > available()) {
    throw IllegalArgumentException("reading more bits than are available");
  }

  int result = 0;

  // First, read remainder from current byte
  if (bitOffset_ > 0) {
    int bitsLeft = 8 - bitOffset_;
    int toRead = numBits < bitsLeft ? numBits : bitsLeft;
    int bitsToNotRead = bitsLeft - toRead;
    int mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
    result = (bytes_[byteOffset_] & mask) >> bitsToNotRead;
    numBits -= toRead;
    bitOffset_ += toRead;
    if (bitOffset_ == 8) {
      bitOffset_ = 0;
      byteOffset_++;
    }
  }

  // Next read whole bytes
  if (numBits > 0) {
    while (numBits >= 8) {
      result = (result << 8) | (bytes_[byteOffset_] & 0xFF);
      byteOffset_++;
      numBits -= 8;
    }


    // Finally read a partial byte
    if (numBits > 0) {
      int bitsToNotRead = 8 - numBits;
      int mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
      result = (result << numBits) | ((bytes_[byteOffset_] & mask) >> bitsToNotRead);
      bitOffset_ += numBits;
    }
  }

  return result;
}

int BitSource::available() {
  return 8 * (bytes_.size() - byteOffset_) - bitOffset_;
}
}

// file: zxing/common/CharacterSetECI.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 * Copyright 2008-2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/CharacterSetECI.h>
// #include <sstream>
// #include <zxing/common/IllegalArgumentException.h>

using std::string;

using zxing::common::CharacterSetECI;
using zxing::IllegalArgumentException;

std::map<int, CharacterSetECI*> CharacterSetECI::VALUE_TO_ECI;
std::map<std::string, CharacterSetECI*> CharacterSetECI::NAME_TO_ECI;

const bool CharacterSetECI::inited = CharacterSetECI::init_tables();

bool CharacterSetECI::init_tables() {
  addCharacterSet(0, "Cp437");
  { char const* s[] = {"ISO8859_1", "ISO-8859-1", 0};
    addCharacterSet(1, s); }
  addCharacterSet(2, "Cp437");
  { char const* s[] = {"ISO8859_1", "ISO-8859-1", 0};
    addCharacterSet(3, s); }
  addCharacterSet(4, "ISO8859_2");
  addCharacterSet(5, "ISO8859_3");
  addCharacterSet(6, "ISO8859_4");
  addCharacterSet(7, "ISO8859_5");
  addCharacterSet(8, "ISO8859_6");
  addCharacterSet(9, "ISO8859_7");
  addCharacterSet(10, "ISO8859_8");
  addCharacterSet(11, "ISO8859_9");
  addCharacterSet(12, "ISO8859_10");
  addCharacterSet(13, "ISO8859_11");
  addCharacterSet(15, "ISO8859_13");
  addCharacterSet(16, "ISO8859_14");
  addCharacterSet(17, "ISO8859_15");
  addCharacterSet(18, "ISO8859_16");
  { char const* s[] = {"SJIS", "Shift_JIS", 0};
    addCharacterSet(20, s ); }
  return true;
}

CharacterSetECI::CharacterSetECI(int value, char const* encodingName_)
  : ECI(value), encodingName(encodingName_) {}

char const* CharacterSetECI::getEncodingName() {
  return encodingName;
}

void CharacterSetECI::addCharacterSet(int value, char const* encodingName) {
  CharacterSetECI* eci = new CharacterSetECI(value, encodingName);
  VALUE_TO_ECI[value] = eci; // can't use valueOf
  NAME_TO_ECI[string(encodingName)] = eci;
}

void CharacterSetECI::addCharacterSet(int value, char const* const* encodingNames) {
  CharacterSetECI* eci = new CharacterSetECI(value, encodingNames[0]);
  VALUE_TO_ECI[value] = eci;
  for (int i = 0; encodingNames[i]; i++) {
    NAME_TO_ECI[string(encodingNames[i])] = eci;
  }
}

CharacterSetECI* CharacterSetECI::getCharacterSetECIByValue(int value) {
  if (value < 0 || value >= 900) {
    std::ostringstream oss;
    oss << "Bad ECI value: " << value;
    throw IllegalArgumentException(oss.str().c_str());
  }
  return VALUE_TO_ECI[value];
}

CharacterSetECI* CharacterSetECI::getCharacterSetECIByName(string const& name) {
  return NAME_TO_ECI[name];
}

// file: zxing/common/Counted.cpp

/*
 *  Counted.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 07/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/Counted.h>

namespace zxing {

using namespace std;

template<class T>
ostream& operator<<(ostream &out, Ref<T>& ref) {
  out << "Ref(" << (ref.object_ ? (*ref.object_) : "NULL") << ")";
  return out;
}
}

// file: zxing/common/DecoderResult.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  DecoderResult.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008-2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/DecoderResult.h>

using namespace std;
using namespace zxing;

DecoderResult::DecoderResult(ArrayRef<unsigned char> rawBytes,
                             Ref<String> text,
                             ArrayRef< ArrayRef<unsigned char> >& byteSegments,
                             string const& ecLevel) :
  rawBytes_(rawBytes),
  text_(text),
  byteSegments_(byteSegments),
  ecLevel_(ecLevel) {}

DecoderResult::DecoderResult(ArrayRef<unsigned char> rawBytes,
                             Ref<String> text)
  : rawBytes_(rawBytes), text_(text) {}

ArrayRef<unsigned char> DecoderResult::getRawBytes() {
  return rawBytes_;
}

Ref<String> DecoderResult::getText() {
  return text_;
}

// file: zxing/common/DetectorResult.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  DetectorResult.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 14/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/DetectorResult.h>

namespace zxing {

DetectorResult::DetectorResult(Ref<BitMatrix> bits, std::vector<Ref<ResultPoint> > points, Ref<PerspectiveTransform> transform) :
  bits_(bits), points_(points), transform_(transform) {
}

Ref<BitMatrix> DetectorResult::getBits() {
  return bits_;
}

std::vector<Ref<ResultPoint> > DetectorResult::getPoints() {
  return points_;
}

Ref<PerspectiveTransform> DetectorResult::getTransform() {
  return transform_;
}

}

// file: zxing/common/ECI.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 * Copyright 2008-2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/ECI.h>
// #include <sstream>
// #include <zxing/common/CharacterSetECI.h>
// #include <zxing/common/IllegalArgumentException.h>

using zxing::common::ECI;
using zxing::IllegalArgumentException;

ECI::ECI(int value_) : value(value_) {}

int ECI::getValue() const {
  return value;
}

ECI* ECI::getECIByValue(int value) {
  if (value < 0 || value > 999999) {
    std::ostringstream oss;
    oss << "Bad ECI value: " << value;
    throw IllegalArgumentException(oss.str().c_str());
  }
  if (value < 900) { // Character set ECIs use 000000 - 000899
    return CharacterSetECI::getCharacterSetECIByValue(value);
  }
  return 0;
}

// file: zxing/common/EdgeDetector.cpp

/*
 *  EdgeDetector.cpp
 *  zxing
 *
 *  Created by Ralf Kistner on 7/12/2009.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/EdgeDetector.h>
// #include <algorithm>
// #include <cmath>

using namespace std;

namespace zxing {
namespace EdgeDetector {

void findEdgePoints(std::vector<Point>& points, const BitMatrix& image, Point start, Point end, bool invert, int skip, float deviation) {
  float xdist = end.x - start.x;
  float ydist = end.y - start.y;
  float length = sqrt(xdist * xdist + ydist * ydist);


  int var;

  if (abs(xdist) > abs(ydist)) {
    // Horizontal
    if (xdist < 0)
      skip = -skip;

    var = int(abs(deviation * length / xdist));

    float dy = ydist / xdist * skip;
    bool left = (skip < 0) ^ invert;
    int x = int(start.x);

    int steps = int(xdist / skip);
    for (int i = 0; i < steps; i++) {
      x += skip;
      if (x < 0 || x >= (int)image.getWidth())
        continue; // In case we start off the edge
      int my = int(start.y + dy * i);
      int ey = min(my + var + 1, (int)image.getHeight() - 1);
      int sy = max(my - var, 0);
      for (int y = sy + 1; y < ey; y++) {
        if (left) {
          if (image.get(x, y) && !image.get(x, y + 1)) {
            points.push_back(Point(x, y + 0.5f));
          }
        } else {
          if (!image.get(x, y) && image.get(x, y + 1)) {
            points.push_back(Point(x, y + 0.5f));
          }
        }
      }
    }
  } else {
    // Vertical
    if (ydist < 0)
      skip = -skip;

    var = int(abs(deviation * length / ydist));

    float dx = xdist / ydist * skip;
    bool down = (skip > 0) ^ invert;
    int y = int(start.y);

    int steps = int(ydist / skip);
    for (int i = 0; i < steps; i++) {
      y += skip;
      if (y < 0 || y >= (int)image.getHeight())
        continue; // In case we start off the edge
      int mx = int(start.x + dx * i);
      int ex = min(mx + var + 1, (int)image.getWidth() - 1);
      int sx = max(mx - var, 0);
      for (int x = sx + 1; x < ex; x++) {
        if (down) {
          if (image.get(x, y) && !image.get(x + 1, y)) {
            points.push_back(Point(x + 0.5f, y));
          }

        } else {
          if (!image.get(x, y) && image.get(x + 1, y)) {
            points.push_back(Point(x + 0.5f, y));
          }
        }

      }
    }

  }
}

Line findLine(const BitMatrix& image, Line estimate, bool invert, int deviation, float threshold, int skip) {
  float t = threshold * threshold;

  Point start = estimate.start;
  Point end = estimate.end;

  vector<Point> edges;
  edges.clear();
  findEdgePoints(edges, image, start, end, invert, skip, deviation);

  int n = edges.size();

  float xdist = end.x - start.x;
  float ydist = end.y - start.y;

  bool horizontal = abs(xdist) > abs(ydist);

  float max = 0;
  Line bestLine(start, end);  // prepopulate with the given line, in case we can't find any line for some reason

  for (int i = -deviation; i < deviation; i++) {
    float x1, y1;
    if (horizontal) {
      y1 = start.y + i;
      x1 = start.x - i * ydist / xdist;
    } else {
      y1 = start.y - i * xdist / ydist;
      x1 = start.x + i;
    }

    for (int j = -deviation; j < deviation; j++) {
      float x2, y2;
      if (horizontal) {
        y2 = end.y + j;
        x2 = end.x - j * ydist / xdist;
      } else {
        y2 = end.y - j * xdist / ydist;
        x2 = end.x + j;
      }

      float dx = x1 - x2;
      float dy = y1 - y2;
      float length = sqrt(dx * dx + dy * dy);

      float score = 0;

      for(int k = 0; k < n; k++) {
        const Point& edge = edges[k];
        float dist = ((x1 - edge.x) * dy - (y1 - edge.y) * dx) / length;
        // Similar to least squares method
        float s = t - dist * dist;
        if (s > 0)
          score += s;
      }

      if (score > max) {
        max = score;
        bestLine.start = Point(x1, y1);
        bestLine.end = Point(x2, y2);
      }
    }
  }

  return bestLine;
}

Point intersection(Line a, Line b) {
  float dxa = a.start.x - a.end.x;
  float dxb = b.start.x - b.end.x;
  float dya = a.start.y - a.end.y;
  float dyb = b.start.y - b.end.y;

  float p = a.start.x * a.end.y - a.start.y * a.end.x;
  float q = b.start.x * b.end.y - b.start.y * b.end.x;
  float denom = dxa * dyb - dya * dxb;
  if(denom == 0)  // Lines don't intersect
    return Point(INFINITY, INFINITY);

  float x = (p * dxb - dxa * q) / denom;
  float y = (p * dyb - dya * q) / denom;

  return Point(x, y);
}

} // namespace EdgeDetector
} // namespace zxing

// file: zxing/common/GlobalHistogramBinarizer.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  GlobalHistogramBinarizer.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/GlobalHistogramBinarizer.h>
// #include <zxing/common/IllegalArgumentException.h>
// #include <zxing/common/Array.h>

namespace zxing {
using namespace std;

const int LUMINANCE_BITS_25 = 5;
const int LUMINANCE_SHIFT_25 = 8 - LUMINANCE_BITS_25;
const int LUMINANCE_BUCKETS_25 = 1 << LUMINANCE_BITS_25;

GlobalHistogramBinarizer::GlobalHistogramBinarizer(Ref<LuminanceSource> source) :
  Binarizer(source), cached_matrix_(NULL), cached_row_(NULL), cached_row_num_(-1) {

}

GlobalHistogramBinarizer::~GlobalHistogramBinarizer() {
}


Ref<BitArray> GlobalHistogramBinarizer::getBlackRow(int y, Ref<BitArray> row) {
  if (y == cached_row_num_) {
    if (cached_row_ != NULL) {
      return cached_row_;
    } else {
      throw IllegalArgumentException("Too little dynamic range in luminance");
    }
  }

  vector<int> histogram(LUMINANCE_BUCKETS_25, 0);
  LuminanceSource& source = *getLuminanceSource();
  int width = source.getWidth();
  if (row == NULL || static_cast<int>(row->getSize()) < width) {
    row = new BitArray(width);
  } else {
    row->clear();
  }

  //TODO(flyashi): cache this instead of allocating and deleting per row
  unsigned char* row_pixels = NULL;
  try {
    row_pixels = new unsigned char[width];
    row_pixels = source.getRow(y, row_pixels);
    for (int x = 0; x < width; x++) {
      histogram[row_pixels[x] >> LUMINANCE_SHIFT_25]++;
    }
    int blackPoint = estimate(histogram);

    BitArray& array = *row;
    int left = row_pixels[0];
    int center = row_pixels[1];
    for (int x = 1; x < width - 1; x++) {
      int right = row_pixels[x + 1];
      // A simple -1 4 -1 box filter with a weight of 2.
      int luminance = ((center << 2) - left - right) >> 1;
      if (luminance < blackPoint) {
        array.set(x);
      }
      left = center;
      center = right;
    }

    cached_row_ = row;
    cached_row_num_ = y;
    delete [] row_pixels;
    return row;
  } catch (IllegalArgumentException const& iae) {
    // Cache the fact that this row failed.
    cached_row_ = NULL;
    cached_row_num_ = y;
    delete [] row_pixels;
    throw iae;
  }
}

Ref<BitMatrix> GlobalHistogramBinarizer::getBlackMatrix() {
  if (cached_matrix_ != NULL) {
    return cached_matrix_;
  }

  // Faster than working with the reference
  LuminanceSource& source = *getLuminanceSource();
  int width = source.getWidth();
  int height = source.getHeight();
  vector<int> histogram(LUMINANCE_BUCKETS_25, 0);

  // Quickly calculates the histogram by sampling four rows from the image.
  // This proved to be more robust on the blackbox tests than sampling a
  // diagonal as we used to do.
  ArrayRef<unsigned char> ref (width);
  unsigned char* row = &ref[0];
  for (int y = 1; y < 5; y++) {
    int rownum = height * y / 5;
    int right = (width << 2) / 5;
    row = source.getRow(rownum, row);
    for (int x = width / 5; x < right; x++) {
      histogram[row[x] >> LUMINANCE_SHIFT_25]++;
    }
  }

  int blackPoint = estimate(histogram);

  Ref<BitMatrix> matrix_ref(new BitMatrix(width, height));
  BitMatrix& matrix = *matrix_ref;
  for (int y = 0; y < height; y++) {
    row = source.getRow(y, row);
    for (int x = 0; x < width; x++) {
      if (row[x] < blackPoint)
        matrix.set(x, y);
    }
  }

  cached_matrix_ = matrix_ref;
  // delete [] row;
  return matrix_ref;
}

int GlobalHistogramBinarizer::estimate(vector<int> &histogram) {
  int numBuckets = histogram.size();
  int maxBucketCount = 0;

  // Find tallest peak in histogram
  int firstPeak = 0;
  int firstPeakSize = 0;
  for (int i = 0; i < numBuckets; i++) {
    if (histogram[i] > firstPeakSize) {
      firstPeak = i;
      firstPeakSize = histogram[i];
    }
    if (histogram[i] > maxBucketCount) {
      maxBucketCount = histogram[i];
    }
  }

  // Find second-tallest peak -- well, another peak that is tall and not
  // so close to the first one
  int secondPeak = 0;
  int secondPeakScore = 0;
  for (int i = 0; i < numBuckets; i++) {
    int distanceToBiggest = i - firstPeak;
    // Encourage more distant second peaks by multiplying by square of distance
    int score = histogram[i] * distanceToBiggest * distanceToBiggest;
    if (score > secondPeakScore) {
      secondPeak = i;
      secondPeakScore = score;
    }
  }

  // Put firstPeak first
  if (firstPeak > secondPeak) {
    int temp = firstPeak;
    firstPeak = secondPeak;
    secondPeak = temp;
  }

  // Kind of arbitrary; if the two peaks are very close, then we figure there is
  // so little dynamic range in the image, that discriminating black and white
  // is too error-prone.
  // Decoding the image/line is either pointless, or may in some cases lead to
  // a false positive for 1D formats, which are relatively lenient.
  // We arbitrarily say "close" is
  // "<= 1/16 of the total histogram buckets apart"
  if (secondPeak - firstPeak <= numBuckets >> 4) {
    throw IllegalArgumentException("Too little dynamic range in luminance");
  }

  // Find a valley between them that is low and closer to the white peak
  int bestValley = secondPeak - 1;
  int bestValleyScore = -1;
  for (int i = secondPeak - 1; i > firstPeak; i--) {
    int fromFirst = i - firstPeak;
    // Favor a "valley" that is not too close to either peak -- especially not
    // the black peak -- and that has a low value of course
    int score = fromFirst * fromFirst * (secondPeak - i) *
      (maxBucketCount - histogram[i]);
    if (score > bestValleyScore) {
      bestValley = i;
      bestValleyScore = score;
    }
  }

  return bestValley << LUMINANCE_SHIFT_25;
}

Ref<Binarizer> GlobalHistogramBinarizer::createBinarizer(Ref<LuminanceSource> source) {
  return Ref<Binarizer> (new GlobalHistogramBinarizer(source));
}

} // namespace zxing

// file: zxing/common/GreyscaleLuminanceSource.cpp

/*
 *  GreyscaleLuminanceSource.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/GreyscaleLuminanceSource.h>
// #include <zxing/common/GreyscaleRotatedLuminanceSource.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {

GreyscaleLuminanceSource::GreyscaleLuminanceSource(unsigned char* greyData, int dataWidth,
    int dataHeight, int left, int top, int width, int height) : greyData_(greyData),
    dataWidth_(dataWidth), dataHeight_(dataHeight), left_(left), top_(top), width_(width),
    height_(height) {

  if (left + width > dataWidth || top + height > dataHeight || top < 0 || left < 0) {
    throw IllegalArgumentException("Crop rectangle does not fit within image data.");
  }
}

unsigned char* GreyscaleLuminanceSource::getRow(int y, unsigned char* row) {
  if (y < 0 || y >= this->getHeight()) {
    throw IllegalArgumentException("Requested row is outside the image.");
  }
  int width = getWidth();
  // TODO(flyashi): determine if row has enough size.
  if (row == NULL) {
    row = new unsigned char[width_];
  }
  int offset = (y + top_) * dataWidth_ + left_;
  memcpy(row, &greyData_[offset], width);
  return row;
}

unsigned char* GreyscaleLuminanceSource::getMatrix() {
  int size = width_ * height_;
  unsigned char* result = new unsigned char[size];
  if (left_ == 0 && top_ == 0 && dataWidth_ == width_ && dataHeight_ == height_) {
    memcpy(result, greyData_, size);
  } else {
    for (int row = 0; row < height_; row++) {
      memcpy(result + row * width_, greyData_ + (top_ + row) * dataWidth_ + left_, width_);
    }
  }
  return result;
}

Ref<LuminanceSource> GreyscaleLuminanceSource::rotateCounterClockwise() {
  // Intentionally flip the left, top, width, and height arguments as needed. dataWidth and
  // dataHeight are always kept unrotated.
  return Ref<LuminanceSource> (new GreyscaleRotatedLuminanceSource(greyData_, dataWidth_,
      dataHeight_, top_, left_, height_, width_));
}

} /* namespace */

// file: zxing/common/GreyscaleRotatedLuminanceSource.cpp

/*
 *  GreyscaleRotatedLuminanceSource.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// #include <zxing/common/GreyscaleRotatedLuminanceSource.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {

// Note that dataWidth and dataHeight are not reversed, as we need to be able to traverse the
// greyData correctly, which does not get rotated.
GreyscaleRotatedLuminanceSource::GreyscaleRotatedLuminanceSource(unsigned char* greyData,
    int dataWidth, int dataHeight, int left, int top, int width, int height) : greyData_(greyData),
    dataWidth_(dataWidth), dataHeight_(dataHeight), left_(left), top_(top), width_(width),
    height_(height) {

  // Intentionally comparing to the opposite dimension since we're rotated.
  if (left + width > dataHeight || top + height > dataWidth) {
    throw IllegalArgumentException("Crop rectangle does not fit within image data.");
  }
}

// The API asks for rows, but we're rotated, so we return columns.
unsigned char* GreyscaleRotatedLuminanceSource::getRow(int y, unsigned char* row) {
  if (y < 0 || y >= getHeight()) {
    throw IllegalArgumentException("Requested row is outside the image");
  }
  int width = getWidth();
  if (row == NULL) {
    row = new unsigned char[width];
  }
  int offset = (left_ * dataWidth_) + (dataWidth_ - (y + top_));
  for (int x = 0; x < width; x++) {
    row[x] = greyData_[offset];
    offset += dataWidth_;
  }
  return row;
}

unsigned char* GreyscaleRotatedLuminanceSource::getMatrix() {
  unsigned char* result = new unsigned char[width_ * height_];
  // This depends on getRow() honoring its second parameter.
  for (int y = 0; y < height_; y++) {
    getRow(y, &result[y * width_]);
  }
  return result;
}

} // namespace

// file: zxing/common/GridSampler.cpp

/*
 *  GridSampler.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 18/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/GridSampler.h>
// #include <zxing/common/PerspectiveTransform.h>
// #include <zxing/ReaderException.h>
// #include <iostream>
// #include <sstream>

namespace zxing {
using namespace std;

GridSampler GridSampler::gridSampler;

GridSampler::GridSampler() {
}

Ref<BitMatrix> GridSampler::sampleGrid(Ref<BitMatrix> image, int dimension, Ref<PerspectiveTransform> transform) {
  Ref<BitMatrix> bits(new BitMatrix(dimension));
  vector<float> points(dimension << 1, (const float)0.0f);
  for (int y = 0; y < dimension; y++) {
    int max = points.size();
    float yValue = (float)y + 0.5f;
    for (int x = 0; x < max; x += 2) {
      points[x] = (float)(x >> 1) + 0.5f;
      points[x + 1] = yValue;
    }
    transform->transformPoints(points);
    checkAndNudgePoints(image, points);
    for (int x = 0; x < max; x += 2) {
      if (image->get((int)points[x], (int)points[x + 1])) {
        bits->set(x >> 1, y);
      }
    }
  }
  return bits;
}

Ref<BitMatrix> GridSampler::sampleGrid(Ref<BitMatrix> image, int dimensionX, int dimensionY, Ref<PerspectiveTransform> transform) {
  Ref<BitMatrix> bits(new BitMatrix(dimensionX, dimensionY));
  vector<float> points(dimensionX << 1, (const float)0.0f);
  for (int y = 0; y < dimensionY; y++) {
    int max = points.size();
    float yValue = (float)y + 0.5f;
    for (int x = 0; x < max; x += 2) {
      points[x] = (float)(x >> 1) + 0.5f;
      points[x + 1] = yValue;
    }
    transform->transformPoints(points);
    checkAndNudgePoints(image, points);
    for (int x = 0; x < max; x += 2) {
      if (image->get((int)points[x], (int)points[x + 1])) {
        bits->set(x >> 1, y);
      }
    }
  }
  return bits;
}

Ref<BitMatrix> GridSampler::sampleGrid(Ref<BitMatrix> image, int dimension, float p1ToX, float p1ToY, float p2ToX,
                                       float p2ToY, float p3ToX, float p3ToY, float p4ToX, float p4ToY, float p1FromX, float p1FromY, float p2FromX,
                                       float p2FromY, float p3FromX, float p3FromY, float p4FromX, float p4FromY) {
  Ref<PerspectiveTransform> transform(PerspectiveTransform::quadrilateralToQuadrilateral(p1ToX, p1ToY, p2ToX, p2ToY,
                                      p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY));

  return sampleGrid(image, dimension, transform);

}

void GridSampler::checkAndNudgePoints(Ref<BitMatrix> image, vector<float> &points) {
  int width = image->getWidth();
  int height = image->getHeight();


  // The Java code assumes that if the start and end points are in bounds, the rest will also be.
  // However, in some unusual cases points in the middle may also be out of bounds.
  // Since we can't rely on an ArrayIndexOutOfBoundsException like Java, we check every point.

  for (size_t offset = 0; offset < points.size(); offset += 2) {
    int x = (int)points[offset];
    int y = (int)points[offset + 1];
    if (x < -1 || x > width || y < -1 || y > height) {
      ostringstream s;
      s << "Transformed point out of bounds at " << x << "," << y;
      throw ReaderException(s.str().c_str());
    }

    if (x == -1) {
      points[offset] = 0.0f;
    } else if (x == width) {
      points[offset] = width - 1;
    }
    if (y == -1) {
      points[offset + 1] = 0.0f;
    } else if (y == height) {
      points[offset + 1] = height - 1;
    }
  }

}

GridSampler &GridSampler::getInstance() {
  return gridSampler;
}
}

// file: zxing/common/HybridBinarizer.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  HybridBinarizer.cpp
 *  zxing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/HybridBinarizer.h>

// #include <zxing/common/IllegalArgumentException.h>

using namespace std;
using namespace zxing;

namespace {
  const int BLOCK_SIZE_POWER = 3;
  const int BLOCK_SIZE = 1 << BLOCK_SIZE_POWER;
  const int BLOCK_SIZE_MASK = BLOCK_SIZE - 1;
  const int MINIMUM_DIMENSION = BLOCK_SIZE * 5;
}

HybridBinarizer::HybridBinarizer(Ref<LuminanceSource> source) :
  GlobalHistogramBinarizer(source), matrix_(NULL), cached_row_(NULL), cached_row_num_(-1) {
}

HybridBinarizer::~HybridBinarizer() {
}


Ref<Binarizer>
HybridBinarizer::createBinarizer(Ref<LuminanceSource> source) {
  return Ref<Binarizer> (new HybridBinarizer(source));
}

Ref<BitMatrix> HybridBinarizer::getBlackMatrix() {
  // Calculates the final BitMatrix once for all requests. This could
  // be called once from the constructor instead, but there are some
  // advantages to doing it lazily, such as making profiling easier,
  // and not doing heavy lifting when callers don't expect it.
  if (matrix_) {
    return matrix_;
  }
  LuminanceSource& source = *getLuminanceSource();
  if (source.getWidth() >= MINIMUM_DIMENSION &&
      source.getHeight() >= MINIMUM_DIMENSION) {
    unsigned char* luminances = source.getMatrix();
    int width = source.getWidth();
    int height = source.getHeight();
    int subWidth = width >> BLOCK_SIZE_POWER;
    if ((width & BLOCK_SIZE_MASK) != 0) {
      subWidth++;
    }
    int subHeight = height >> BLOCK_SIZE_POWER;
    if ((height & BLOCK_SIZE_MASK) != 0) {
      subHeight++;
    }
    int* blackPoints =
      calculateBlackPoints(luminances, subWidth, subHeight, width, height);

    Ref<BitMatrix> newMatrix (new BitMatrix(width, height));
    calculateThresholdForBlock(luminances,
                               subWidth,
                               subHeight,
                               width,
                               height,
                               blackPoints,
                               newMatrix);
    matrix_ = newMatrix;

    // N.B.: these deletes are inadequate if anything between the new
    // and this point can throw.  As of this writing, it doesn't look
    // like they do.

    delete [] blackPoints;
    delete [] luminances;
  } else {
    // If the image is too small, fall back to the global histogram approach.
    matrix_ = GlobalHistogramBinarizer::getBlackMatrix();
  }
  return matrix_;
}

void
HybridBinarizer::calculateThresholdForBlock(unsigned char* luminances,
                                            int subWidth,
                                            int subHeight,
                                            int width,
                                            int height,
                                            int blackPoints[],
                                            Ref<BitMatrix> const& matrix) {
  for (int y = 0; y < subHeight; y++) {
    int yoffset = y << BLOCK_SIZE_POWER;
    if (yoffset + BLOCK_SIZE >= height) {
      yoffset = height - BLOCK_SIZE;
    }
    for (int x = 0; x < subWidth; x++) {
      int xoffset = x << BLOCK_SIZE_POWER;
      if (xoffset + BLOCK_SIZE >= width) {
        xoffset = width - BLOCK_SIZE;
      }
      int left = (x > 1) ? x : 2;
      left = (left < subWidth - 2) ? left : subWidth - 3;
      int top = (y > 1) ? y : 2;
      top = (top < subHeight - 2) ? top : subHeight - 3;
      int sum = 0;
      for (int z = -2; z <= 2; z++) {
        int *blackRow = &blackPoints[(top + z) * subWidth];
        sum += blackRow[left - 2];
        sum += blackRow[left - 1];
        sum += blackRow[left];
        sum += blackRow[left + 1];
        sum += blackRow[left + 2];
      }
      int average = sum / 25;
      threshold8x8Block(luminances, xoffset, yoffset, average, width, matrix);
    }
  }
}

void HybridBinarizer::threshold8x8Block(unsigned char* luminances,
                                        int xoffset,
                                        int yoffset,
                                        int threshold,
                                        int stride,
                                        Ref<BitMatrix> const& matrix) {
  for (int y = 0, offset = yoffset * stride + xoffset;
       y < BLOCK_SIZE;
       y++,  offset += stride) {
    for (int x = 0; x < BLOCK_SIZE; x++) {
      int pixel = luminances[offset + x] & 0xff;
      if (pixel <= threshold) {
        matrix->set(xoffset + x, yoffset + y);
      }
    }
  }
}

namespace {
  inline int getBlackPointFromNeighbors(int* blackPoints, int subWidth, int x, int y) {
    return (blackPoints[(y-1)*subWidth+x] +
            2*blackPoints[y*subWidth+x-1] +
            blackPoints[(y-1)*subWidth+x-1]) >> 2;
  }
}

int* HybridBinarizer::calculateBlackPoints(unsigned char* luminances, int subWidth, int subHeight,
    int width, int height) {
  int *blackPoints = new int[subHeight * subWidth];
  for (int y = 0; y < subHeight; y++) {
    int yoffset = y << BLOCK_SIZE_POWER;
    if (yoffset + BLOCK_SIZE >= height) {
      yoffset = height - BLOCK_SIZE;
    }
    for (int x = 0; x < subWidth; x++) {
      int xoffset = x << BLOCK_SIZE_POWER;
      if (xoffset + BLOCK_SIZE >= width) {
        xoffset = width - BLOCK_SIZE;
      }
      int sum = 0;
      int min = 0xFF;
      int max = 0;
      for (int yy = 0, offset = yoffset * width + xoffset;
           yy < BLOCK_SIZE;
           yy++, offset += width) {
        for (int xx = 0; xx < BLOCK_SIZE; xx++) {
          int pixel = luminances[offset + xx] & 0xFF;
          sum += pixel;
          if (pixel < min) {
            min = pixel;
          }
          if (pixel > max) {
            max = pixel;
          }
        }
      }

      // See
      // http://groups.google.com/group/zxing/browse_thread/thread/d06efa2c35a7ddc0
      int average = sum >> 6;
      if (max - min <= 24) {
        average = min >> 1;
        if (y > 0 && x > 0) {
          int bp = getBlackPointFromNeighbors(blackPoints, subWidth, x, y);
          if (min < bp) {
            average = bp;
          }
        }
      }
      blackPoints[y * subWidth + x] = average;
    }
  }
  return blackPoints;
}


// file: zxing/common/IllegalArgumentException.cpp

/*
 *  IllegalArgumentException.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 06/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {

IllegalArgumentException::IllegalArgumentException(const char *msg) :
    Exception(msg) {
}
IllegalArgumentException::~IllegalArgumentException() throw() {

}
}

// file: zxing/common/PerspectiveTransform.cpp

/*
 *  PerspectiveTransform.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 12/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/PerspectiveTransform.h>

namespace zxing {
using namespace std;

PerspectiveTransform::PerspectiveTransform(float inA11, float inA21,
                                           float inA31, float inA12,
                                           float inA22, float inA32,
                                           float inA13, float inA23,
                                           float inA33) :
  a11(inA11), a12(inA12), a13(inA13), a21(inA21), a22(inA22), a23(inA23),
  a31(inA31), a32(inA32), a33(inA33) {}

Ref<PerspectiveTransform> PerspectiveTransform::quadrilateralToQuadrilateral(float x0, float y0, float x1, float y1,
    float x2, float y2, float x3, float y3, float x0p, float y0p, float x1p, float y1p, float x2p, float y2p,
    float x3p, float y3p) {
  Ref<PerspectiveTransform> qToS = PerspectiveTransform::quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3);
  Ref<PerspectiveTransform> sToQ =
    PerspectiveTransform::squareToQuadrilateral(x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p);
  return sToQ->times(qToS);
}

Ref<PerspectiveTransform> PerspectiveTransform::squareToQuadrilateral(float x0, float y0, float x1, float y1, float x2,
    float y2, float x3, float y3) {
  float dy2 = y3 - y2;
  float dy3 = y0 - y1 + y2 - y3;
  if (dy2 == 0.0f && dy3 == 0.0f) {
    Ref<PerspectiveTransform> result(new PerspectiveTransform(x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0.0f,
                                     0.0f, 1.0f));
    return result;
  } else {
    float dx1 = x1 - x2;
    float dx2 = x3 - x2;
    float dx3 = x0 - x1 + x2 - x3;
    float dy1 = y1 - y2;
    float denominator = dx1 * dy2 - dx2 * dy1;
    float a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
    float a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
    Ref<PerspectiveTransform> result(new PerspectiveTransform(x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0, y1 - y0
                                     + a13 * y1, y3 - y0 + a23 * y3, y0, a13, a23, 1.0f));
    return result;
  }
}

Ref<PerspectiveTransform> PerspectiveTransform::quadrilateralToSquare(float x0, float y0, float x1, float y1, float x2,
    float y2, float x3, float y3) {
  // Here, the adjoint serves as the inverse:
  return squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3)->buildAdjoint();
}

Ref<PerspectiveTransform> PerspectiveTransform::buildAdjoint() {
  // Adjoint is the transpose of the cofactor matrix:
  Ref<PerspectiveTransform> result(new PerspectiveTransform(a22 * a33 - a23 * a32, a23 * a31 - a21 * a33, a21 * a32
                                   - a22 * a31, a13 * a32 - a12 * a33, a11 * a33 - a13 * a31, a12 * a31 - a11 * a32, a12 * a23 - a13 * a22,
                                   a13 * a21 - a11 * a23, a11 * a22 - a12 * a21));
  return result;
}

Ref<PerspectiveTransform> PerspectiveTransform::times(Ref<PerspectiveTransform> other) {
  Ref<PerspectiveTransform> result(new PerspectiveTransform(a11 * other->a11 + a21 * other->a12 + a31 * other->a13,
                                   a11 * other->a21 + a21 * other->a22 + a31 * other->a23, a11 * other->a31 + a21 * other->a32 + a31
                                   * other->a33, a12 * other->a11 + a22 * other->a12 + a32 * other->a13, a12 * other->a21 + a22
                                   * other->a22 + a32 * other->a23, a12 * other->a31 + a22 * other->a32 + a32 * other->a33, a13
                                   * other->a11 + a23 * other->a12 + a33 * other->a13, a13 * other->a21 + a23 * other->a22 + a33
                                   * other->a23, a13 * other->a31 + a23 * other->a32 + a33 * other->a33));
  return result;
}

void PerspectiveTransform::transformPoints(vector<float> &points) {
  int max = points.size();
  for (int i = 0; i < max; i += 2) {
    float x = points[i];
    float y = points[i + 1];
    float denominator = a13 * x + a23 * y + a33;
    points[i] = (a11 * x + a21 * y + a31) / denominator;
    points[i + 1] = (a12 * x + a22 * y + a32) / denominator;
  }
}

ostream& operator<<(ostream& out, const PerspectiveTransform &pt) {
  out << pt.a11 << ", " << pt.a12 << ", " << pt.a13 << ", \n";
  out << pt.a21 << ", " << pt.a22 << ", " << pt.a23 << ", \n";
  out << pt.a31 << ", " << pt.a32 << ", " << pt.a33 << "\n";
  return out;
}

}

// file: zxing/common/Str.cpp

/*
 *  String.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/Str.h>

namespace zxing {
using namespace std;

String::String(const std::string &text) :
    text_(text) {
}
const std::string& String::getText() const {
  return text_;
}

ostream &operator<<(ostream &out, const String &s) {
  out << s.text_;
  return out;
}

}

// file: zxing/common/StringUtils.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

/*
 * Copyright (C) 2010-2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/StringUtils.h>
// #include <zxing/DecodeHints.h>

using namespace std;
using namespace zxing;
using namespace zxing::common;

// N.B.: these are the iconv strings for at least some versions of iconv

char const* const StringUtils::PLATFORM_DEFAULT_ENCODING = "UTF-8";
char const* const StringUtils::ASCII = "ASCII";
char const* const StringUtils::SHIFT_JIS = "SHIFT_JIS";
char const* const StringUtils::GB2312 = "GBK";
char const* const StringUtils::EUC_JP = "EUC-JP";
char const* const StringUtils::UTF8 = "UTF-8";
char const* const StringUtils::ISO88591 = "ISO8859-1";
const bool StringUtils::ASSUME_SHIFT_JIS = false;

string
StringUtils::guessEncoding(unsigned char* bytes, int length, Hashtable const& hints) {
  Hashtable::const_iterator i = hints.find(DecodeHints::CHARACTER_SET);
  if (i != hints.end()) {
    return i->second;
  }
  // Does it start with the UTF-8 byte order mark? then guess it's UTF-8
  if (length > 3 &&
      bytes[0] == (unsigned char) 0xEF &&
      bytes[1] == (unsigned char) 0xBB &&
      bytes[2] == (unsigned char) 0xBF) {
    return UTF8;
  }
  // For now, merely tries to distinguish ISO-8859-1, UTF-8 and Shift_JIS,
  // which should be by far the most common encodings. ISO-8859-1
  // should not have bytes in the 0x80 - 0x9F range, while Shift_JIS
  // uses this as a first byte of a two-byte character. If we see this
  // followed by a valid second byte in Shift_JIS, assume it is Shift_JIS.
  // If we see something else in that second byte, we'll make the risky guess
  // that it's UTF-8.
  bool canBeISO88591 = true;
  bool canBeShiftJIS = true;
  bool canBeUTF8 = true;
  int utf8BytesLeft = 0;
  int maybeDoubleByteCount = 0;
  int maybeSingleByteKatakanaCount = 0;
  bool sawLatin1Supplement = false;
  bool sawUTF8Start = false;
  bool lastWasPossibleDoubleByteStart = false;

  for (int i = 0;
       i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8);
       i++) {

    int value = bytes[i] & 0xFF;

    // UTF-8 stuff
    if (value >= 0x80 && value <= 0xBF) {
      if (utf8BytesLeft > 0) {
        utf8BytesLeft--;
      }
    } else {
      if (utf8BytesLeft > 0) {
        canBeUTF8 = false;
      }
      if (value >= 0xC0 && value <= 0xFD) {
        sawUTF8Start = true;
        int valueCopy = value;
        while ((valueCopy & 0x40) != 0) {
          utf8BytesLeft++;
          valueCopy <<= 1;
        }
      }
    }

    // ISO-8859-1 stuff

    if ((value == 0xC2 || value == 0xC3) && i < length - 1) {
      // This is really a poor hack. The slightly more exotic characters people might want to put in
      // a QR Code, by which I mean the Latin-1 supplement characters (e.g. u-umlaut) have encodings
      // that start with 0xC2 followed by [0xA0,0xBF], or start with 0xC3 followed by [0x80,0xBF].
      int nextValue = bytes[i + 1] & 0xFF;
      if (nextValue <= 0xBF &&
          ((value == 0xC2 && nextValue >= 0xA0) || (value == 0xC3 && nextValue >= 0x80))) {
        sawLatin1Supplement = true;
      }
    }
    if (value >= 0x7F && value <= 0x9F) {
      canBeISO88591 = false;
    }

    // Shift_JIS stuff

    if (value >= 0xA1 && value <= 0xDF) {
      // count the number of characters that might be a Shift_JIS single-byte Katakana character
      if (!lastWasPossibleDoubleByteStart) {
        maybeSingleByteKatakanaCount++;
      }
    }
    if (!lastWasPossibleDoubleByteStart &&
        ((value >= 0xF0 && value <= 0xFF) || value == 0x80 || value == 0xA0)) {
      canBeShiftJIS = false;
    }
    if ((value >= 0x81 && value <= 0x9F) || (value >= 0xE0 && value <= 0xEF)) {
      // These start double-byte characters in Shift_JIS. Let's see if it's followed by a valid
      // second byte.
      if (lastWasPossibleDoubleByteStart) {
        // If we just checked this and the last byte for being a valid double-byte
        // char, don't check starting on this byte. If this and the last byte
        // formed a valid pair, then this shouldn't be checked to see if it starts
        // a double byte pair of course.
        lastWasPossibleDoubleByteStart = false;
      } else {
        // ... otherwise do check to see if this plus the next byte form a valid
        // double byte pair encoding a character.
        lastWasPossibleDoubleByteStart = true;
        if (i >= length - 1) {
          canBeShiftJIS = false;
        } else {
          int nextValue = bytes[i + 1] & 0xFF;
          if (nextValue < 0x40 || nextValue > 0xFC) {
            canBeShiftJIS = false;
          } else {
            maybeDoubleByteCount++;
          }
          // There is some conflicting information out there about which bytes can follow which in
          // double-byte Shift_JIS characters. The rule above seems to be the one that matches practice.
        }
      }
    } else {
      lastWasPossibleDoubleByteStart = false;
    }
  }
  if (utf8BytesLeft > 0) {
    canBeUTF8 = false;
  }

  // Easy -- if assuming Shift_JIS and no evidence it can't be, done
  if (canBeShiftJIS && ASSUME_SHIFT_JIS) {
    return SHIFT_JIS;
  }
  if (canBeUTF8 && sawUTF8Start) {
    return UTF8;
  }
  // Distinguishing Shift_JIS and ISO-8859-1 can be a little tough. The crude heuristic is:
  // - If we saw
  //   - at least 3 bytes that starts a double-byte value (bytes that are rare in ISO-8859-1), or
  //   - over 5% of bytes could be single-byte Katakana (also rare in ISO-8859-1),
  // - and, saw no sequences that are invalid in Shift_JIS, then we conclude Shift_JIS
  if (canBeShiftJIS && (maybeDoubleByteCount >= 3 || 20 * maybeSingleByteKatakanaCount > length)) {
    return SHIFT_JIS;
  }
  // Otherwise, we default to ISO-8859-1 unless we know it can't be
  if (!sawLatin1Supplement && canBeISO88591) {
    return ISO88591;
  }
  // Otherwise, we take a wild guess with platform encoding
  return PLATFORM_DEFAULT_ENCODING;
}

// file: zxing/common/detector/MonochromeRectangleDetector.cpp

/*
 *  MonochromeRectangleDetector.cpp
 *  y_wmk
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 y_wmk authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/NotFoundException.h>
// #include <zxing/common/detector/MonochromeRectangleDetector.h>
// #include <sstream>

namespace zxing {
using namespace std;

std::vector<Ref<ResultPoint> > MonochromeRectangleDetector::detect() {
    int height = image_->getHeight();
    int width = image_->getWidth();
    int halfHeight = height >> 1;
    int halfWidth = width >> 1;
    int deltaY = max(1, height / (MAX_MODULES << 3));
    int deltaX = max(1, width / (MAX_MODULES << 3));

    int top = 0;
    int bottom = height;
    int left = 0;
    int right = width;
    Ref<ResultPoint> pointA(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, -deltaY, top, bottom, halfWidth >> 1));
    top = (int) pointA->getY() - 1;;
    Ref<ResultPoint> pointB(findCornerFromCenter(halfWidth, -deltaX, left, right,
        halfHeight, 0, top, bottom, halfHeight >> 1));
    left = (int) pointB->getX() - 1;
    Ref<ResultPoint> pointC(findCornerFromCenter(halfWidth, deltaX, left, right,
        halfHeight, 0, top, bottom, halfHeight >> 1));
    right = (int) pointC->getX() + 1;
    Ref<ResultPoint> pointD(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, deltaY, top, bottom, halfWidth >> 1));
    bottom = (int) pointD->getY() + 1;

    // Go try to find point A again with better information -- might have been off at first.
    pointA.reset(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, -deltaY, top, bottom, halfWidth >> 2));

	  std::vector<Ref<ResultPoint> > corners(4);
  	corners[0].reset(pointA);
  	corners[1].reset(pointB);
  	corners[2].reset(pointC);
  	corners[3].reset(pointD);
    return corners;
  }

Ref<ResultPoint> MonochromeRectangleDetector::findCornerFromCenter(int centerX, int deltaX, int left, int right,
      int centerY, int deltaY, int top, int bottom, int maxWhiteRun) {
	  Ref<TwoInts> lastRange(NULL);
    for (int y = centerY, x = centerX;
         y < bottom && y >= top && x < right && x >= left;
         y += deltaY, x += deltaX) {
      Ref<TwoInts> range(NULL);
      if (deltaX == 0) {
        // horizontal slices, up and down
        range = blackWhiteRange(y, maxWhiteRun, left, right, true);
      } else {
        // vertical slices, left and right
        range = blackWhiteRange(x, maxWhiteRun, top, bottom, false);
      }
      if (range == NULL) {
        if (lastRange == NULL) {
			    throw NotFoundException("Couldn't find corners (lastRange = NULL) ");
        } else {
        // lastRange was found
        if (deltaX == 0) {
          int lastY = y - deltaY;
          if (lastRange->start < centerX) {
            if (lastRange->end > centerX) {
              // straddle, choose one or the other based on direction
			        Ref<ResultPoint> result(new ResultPoint(deltaY > 0 ? lastRange->start : lastRange->end, lastY));
			        return result;
            }
			      Ref<ResultPoint> result(new ResultPoint(lastRange->start, lastY));
			      return result;
          } else {
			      Ref<ResultPoint> result(new ResultPoint(lastRange->end, lastY));
			      return result;
            }
        } else {
          int lastX = x - deltaX;
          if (lastRange->start < centerY) {
            if (lastRange->end > centerY) {
			        Ref<ResultPoint> result(new ResultPoint(lastX, deltaX < 0 ? lastRange->start : lastRange->end));
			        return result;
            }
			      Ref<ResultPoint> result(new ResultPoint(lastX, lastRange->start));
			      return result;
          } else {
			      Ref<ResultPoint> result(new ResultPoint(lastX, lastRange->end));
			      return result;
            }
          }
        }
      }
      lastRange = range;
    }
    throw NotFoundException("Couldn't find corners");
  }

Ref<TwoInts> MonochromeRectangleDetector::blackWhiteRange(int fixedDimension, int maxWhiteRun, int minDim, int maxDim,
      bool horizontal) {

	  int center = (minDim + maxDim) >> 1;

    // Scan left/up first
    int start = center;
    while (start >= minDim) {
      if (horizontal ? image_->get(start, fixedDimension) : image_->get(fixedDimension, start)) {
        start--;
      } else {
        int whiteRunStart = start;
        do {
          start--;
        } while (start >= minDim && !(horizontal ? image_->get(start, fixedDimension) :
            image_->get(fixedDimension, start)));
        int whiteRunSize = whiteRunStart - start;
        if (start < minDim || whiteRunSize > maxWhiteRun) {
          start = whiteRunStart;
          break;
        }
      }
    }
    start++;

    // Then try right/down
    int end = center;
    while (end < maxDim) {
      if (horizontal ? image_->get(end, fixedDimension) : image_->get(fixedDimension, end)) {
        end++;
      } else {
        int whiteRunStart = end;
        do {
          end++;
        } while (end < maxDim && !(horizontal ? image_->get(end, fixedDimension) :
            image_->get(fixedDimension, end)));
        int whiteRunSize = end - whiteRunStart;
        if (end >= maxDim || whiteRunSize > maxWhiteRun) {
          end = whiteRunStart;
          break;
        }
      }
    }
    end--;
    Ref<TwoInts> result(NULL);
    if (end > start) {
		  result = new TwoInts;
      result->start = start;
      result->end = end;
    }
    return result;
  }
}

// file: zxing/common/detector/WhiteRectangleDetector.cpp

/*
 *  WhiteRectangleDetector.cpp
 *  y_wmk
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 y_wmk authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/NotFoundException.h>
// #include <zxing/common/detector/WhiteRectangleDetector.h>
// #include <math.h>
// #include <sstream>

namespace zxing {
using namespace std;

int WhiteRectangleDetector::INIT_SIZE = 30;
int WhiteRectangleDetector::CORR = 1;


WhiteRectangleDetector::WhiteRectangleDetector(Ref<BitMatrix> image) : image_(image) {
  width_ = image->getWidth();
  height_ = image->getHeight();
}

/**
 * <p>
 * Detects a candidate barcode-like rectangular region within an image. It
 * starts around the center of the image, increases the size of the candidate
 * region until it finds a white rectangular region.
 * </p>
 *
 * @return {@link vector<Ref<ResultPoint> >} describing the corners of the rectangular
 *         region. The first and last points are opposed on the diagonal, as
 *         are the second and third. The first point will be the topmost
 *         point and the last, the bottommost. The second point will be
 *         leftmost and the third, the rightmost
 * @throws NotFoundException if no Data Matrix Code can be found
*/
std::vector<Ref<ResultPoint> > WhiteRectangleDetector::detect() {
  int left = (width_ - INIT_SIZE) >> 1;
  int right = (width_ + INIT_SIZE) >> 1;
  int up = (height_ - INIT_SIZE) >> 1;
  int down = (height_ + INIT_SIZE) >> 1;
  if (up < 0 || left < 0 || down >= height_ || right >= width_) {
    throw NotFoundException("Invalid dimensions WhiteRectangleDetector");
  }

  bool sizeExceeded = false;
  bool aBlackPointFoundOnBorder = true;
  bool atLeastOneBlackPointFoundOnBorder = false;

  while (aBlackPointFoundOnBorder) {
    aBlackPointFoundOnBorder = false;

    // .....
    // .   |
    // .....
    bool rightBorderNotWhite = true;
    while (rightBorderNotWhite && right < width_) {
      rightBorderNotWhite = containsBlackPoint(up, down, right, false);
      if (rightBorderNotWhite) {
        right++;
        aBlackPointFoundOnBorder = true;
      }
    }

    if (right >= width_) {
      sizeExceeded = true;
      break;
    }

    // .....
    // .   .
    // .___.
    bool bottomBorderNotWhite = true;
    while (bottomBorderNotWhite && down < height_) {
      bottomBorderNotWhite = containsBlackPoint(left, right, down, true);
      if (bottomBorderNotWhite) {
        down++;
        aBlackPointFoundOnBorder = true;
      }
    }

    if (down >= height_) {
      sizeExceeded = true;
      break;
    }

    // .....
    // |   .
    // .....
    bool leftBorderNotWhite = true;
    while (leftBorderNotWhite && left >= 0) {
      leftBorderNotWhite = containsBlackPoint(up, down, left, false);
      if (leftBorderNotWhite) {
        left--;
        aBlackPointFoundOnBorder = true;
      }
    }

    if (left < 0) {
      sizeExceeded = true;
      break;
    }

    // .___.
    // .   .
    // .....
    bool topBorderNotWhite = true;
    while (topBorderNotWhite && up >= 0) {
      topBorderNotWhite = containsBlackPoint(left, right, up, true);
      if (topBorderNotWhite) {
        up--;
        aBlackPointFoundOnBorder = true;
      }
    }

    if (up < 0) {
      sizeExceeded = true;
      break;
    }

    if (aBlackPointFoundOnBorder) {
      atLeastOneBlackPointFoundOnBorder = true;
    }

  }
  if (!sizeExceeded && atLeastOneBlackPointFoundOnBorder) {

    int maxSize = right - left;

    Ref<ResultPoint> z(NULL);
    //go up right
    for (int i = 1; i < maxSize; i++) {
      z = getBlackPointOnSegment(left, down - i, left + i, down);
      if (z != NULL) {
        break;
      }
    }

    if (z == NULL) {
      throw NotFoundException("z == NULL");
    }

    Ref<ResultPoint> t(NULL);
    //go down right
    for (int i = 1; i < maxSize; i++) {
      t = getBlackPointOnSegment(left, up + i, left + i, up);
      if (t != NULL) {
        break;
      }
    }

    if (t == NULL) {
      throw NotFoundException("t == NULL");
    }

    Ref<ResultPoint> x(NULL);
    //go down left
    for (int i = 1; i < maxSize; i++) {
      x = getBlackPointOnSegment(right, up + i, right - i, up);
      if (x != NULL) {
        break;
      }
    }

    if (x == NULL) {
      throw NotFoundException("x == NULL");
    }

    Ref<ResultPoint> y(NULL);
    //go up left
    for (int i = 1; i < maxSize; i++) {
      y = getBlackPointOnSegment(right, down - i, right - i, down);
      if (y != NULL) {
        break;
      }
    }

    if (y == NULL) {
      throw NotFoundException("y == NULL");
    }

    return centerEdges(y, z, x, t);

  } else {
    throw NotFoundException("No black point found on border");
  }
}

/**
 * Ends up being a bit faster than Math.round(). This merely rounds its
 * argument to the nearest int, where x.5 rounds up.
 */
int WhiteRectangleDetector::round(float d) {
  return (int) (d + 0.5f);
}

Ref<ResultPoint> WhiteRectangleDetector::getBlackPointOnSegment(float aX, float aY, float bX, float bY) {
  int dist = distanceL2(aX, aY, bX, bY);
  float xStep = (bX - aX) / dist;
  float yStep = (bY - aY) / dist;
  for (int i = 0; i < dist; i++) {
    int x = round(aX + i * xStep);
    int y = round(aY + i * yStep);
    if (image_->get(x, y)) {
      Ref<ResultPoint> point(new ResultPoint(x, y));
      return point;
    }
  }
  Ref<ResultPoint> point(NULL);
  return point;
}

int WhiteRectangleDetector::distanceL2(float aX, float aY, float bX, float bY) {
  float xDiff = aX - bX;
  float yDiff = aY - bY;
  return round((float)sqrt(xDiff * xDiff + yDiff * yDiff));
}

/**
 * recenters the points of a constant distance towards the center
 *
 * @param y bottom most point
 * @param z left most point
 * @param x right most point
 * @param t top most point
 * @return {@link vector<Ref<ResultPoint> >} describing the corners of the rectangular
 *         region. The first and last points are opposed on the diagonal, as
 *         are the second and third. The first point will be the topmost
 *         point and the last, the bottommost. The second point will be
 *         leftmost and the third, the rightmost
 */
vector<Ref<ResultPoint> > WhiteRectangleDetector::centerEdges(Ref<ResultPoint> y, Ref<ResultPoint> z,
                                  Ref<ResultPoint> x, Ref<ResultPoint> t) {

  //
  //       t            t
  //  z                      x
  //        x    OR    z
  //   y                    y
  //

  float yi = y->getX();
  float yj = y->getY();
  float zi = z->getX();
  float zj = z->getY();
  float xi = x->getX();
  float xj = x->getY();
  float ti = t->getX();
  float tj = t->getY();

  std::vector<Ref<ResultPoint> > corners(4);
  if (yi < (float)width_/2) {
    Ref<ResultPoint> pointA(new ResultPoint(ti - CORR, tj + CORR));
    Ref<ResultPoint> pointB(new ResultPoint(zi + CORR, zj + CORR));
    Ref<ResultPoint> pointC(new ResultPoint(xi - CORR, xj - CORR));
    Ref<ResultPoint> pointD(new ResultPoint(yi + CORR, yj - CORR));
	  corners[0].reset(pointA);
	  corners[1].reset(pointB);
	  corners[2].reset(pointC);
	  corners[3].reset(pointD);
  } else {
    Ref<ResultPoint> pointA(new ResultPoint(ti + CORR, tj + CORR));
    Ref<ResultPoint> pointB(new ResultPoint(zi + CORR, zj - CORR));
    Ref<ResultPoint> pointC(new ResultPoint(xi - CORR, xj + CORR));
    Ref<ResultPoint> pointD(new ResultPoint(yi - CORR, yj - CORR));
	  corners[0].reset(pointA);
	  corners[1].reset(pointB);
	  corners[2].reset(pointC);
	  corners[3].reset(pointD);
  }
  return corners;
}

/**
 * Determines whether a segment contains a black point
 *
 * @param a          min value of the scanned coordinate
 * @param b          max value of the scanned coordinate
 * @param fixed      value of fixed coordinate
 * @param horizontal set to true if scan must be horizontal, false if vertical
 * @return true if a black point has been found, else false.
 */
bool WhiteRectangleDetector::containsBlackPoint(int a, int b, int fixed, bool horizontal) {
  if (horizontal) {
    for (int x = a; x <= b; x++) {
      if (image_->get(x, fixed)) {
        return true;
      }
    }
  } else {
    for (int y = a; y <= b; y++) {
      if (image_->get(fixed, y)) {
        return true;
      }
    }
  }

  return false;
}
}

// file: zxing/common/reedsolomon/GF256.cpp

/*
 *  GF256.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 05/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <vector>
// #include <iostream>
// #include <zxing/common/reedsolomon/GF256.h>
// #include <zxing/common/reedsolomon/GF256Poly.h>
// #include <zxing/common/IllegalArgumentException.h>
// #include <zxing/common/Array.h>
// #include <zxing/common/Counted.h>

namespace zxing {
using namespace std;

static inline ArrayRef<int> makeArray(int value) {
  ArrayRef<int> valuesRef(new Array<int> (value, 1));
  return valuesRef;
}

static inline Ref<GF256Poly> refPoly(GF256 &field, int value) {
  ArrayRef<int> values(makeArray(value));
  Ref<GF256Poly> result(new GF256Poly(field, values));
  return result;
}

GF256::GF256(int primitive) :
    exp_(256, (const int)0), log_(256, (const int)0), zero_(refPoly(*this, 0)), one_(refPoly(*this, 1)) {
  int x = 1;
  for (int i = 0; i < 256; i++) {
    exp_[i] = x;
    x <<= 1;
    if (x >= 0x100) {
      x ^= primitive;
    }
  }

  // log(0) == 0, but should never be used
  log_[0] = 0;
  for (int i = 0; i < 255; i++) {
    log_[exp_[i]] = i;
  }
}

Ref<GF256Poly> GF256::getZero() {
  return zero_;
}

Ref<GF256Poly> GF256::getOne() {
  return one_;
}

Ref<GF256Poly> GF256::buildMonomial(int degree, int coefficient) {
#ifdef DEBUG
  cout << __FUNCTION__ << "\n";
#endif
  if (degree < 0) {
    throw IllegalArgumentException("Degree must be non-negative");
  }
  if (coefficient == 0) {
    return zero_;
  }
  int nCoefficients = degree + 1;
  ArrayRef<int> coefficients(new Array<int> (nCoefficients));
  coefficients[0] = coefficient;
  Ref<GF256Poly> result(new GF256Poly(*this, coefficients));
  return result;
}

int GF256::addOrSubtract(int a, int b) {
  return a ^ b;
}

int GF256::exp(int a) {
  return exp_[a];
}

int GF256::log(int a) {
  if (a == 0) {
    throw IllegalArgumentException("Cannot take the logarithm of 0");
  }
  return log_[a];
}

int GF256::inverse(int a) {
  if (a == 0) {
    throw IllegalArgumentException("Cannot calculate the inverse of 0");
  }
  return exp_[255 - log_[a]];
}

int GF256::multiply(int a, int b) {
  if (a == 0 || b == 0) {
    return 0;
  }
  int logSum = log_[a] + log_[b];
  // index is a sped-up alternative to logSum % 255 since sum
  // is in [0,510]. Thanks to jmsachs for the idea
  return exp_[(logSum & 0xFF) + (logSum >> 8)];
}

GF256 GF256::QR_CODE_FIELD(0x011D); // x^8 + x^4 + x^3 + x^2 + 1
GF256 GF256::DATA_MATRIX_FIELD(0x012D); // x^8 + x^5 + x^3 + x^2 + 1

ostream& operator<<(ostream& out, const GF256& field) {
  out << "Field[\nexp=(";
  out << field.exp_[0];
  for (int i = 1; i < 256; i++) {
    out << "," << field.exp_[i];
  }
  out << "),\nlog=(";
  out << field.log_[0];
  for (int i = 1; i < 256; i++) {
    out << "," << field.log_[i];
  }
  out << ")\n]";
  return out;
}

}

// file: zxing/common/reedsolomon/GF256Poly.cpp

/*
 *  GF256Poly.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 05/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <iostream>
// #include <sstream>
// #include <zxing/common/reedsolomon/GF256Poly.h>
// #include <zxing/common/reedsolomon/GF256.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {
using namespace std;

void GF256Poly::fixCoefficients() {
  int coefficientsLength = coefficients.size();
  if (coefficientsLength > 1 && coefficients[0] == 0) {
    // Leading term must be non-zero for anything except
    // the constant polynomial "0"
    int firstNonZero = 1;
    while (firstNonZero < coefficientsLength && coefficients[firstNonZero] == 0) {
      firstNonZero++;
    }
    if (firstNonZero == coefficientsLength) {
      coefficientsLength = field.getZero()->coefficients.size();
      coefficients.reset(new Array<int> (coefficientsLength));
      *coefficients = *(field.getZero()->coefficients);
    } else {
      ArrayRef<int> c(coefficients);
      coefficientsLength -= firstNonZero;
      coefficients.reset(new Array<int> (coefficientsLength));
      for (int i = 0; i < coefficientsLength; i++) {
        coefficients[i] = c[i + firstNonZero];
      }
    }
  }
}

GF256Poly::GF256Poly(GF256 &f, ArrayRef<int> c) :
    Counted(), field(f), coefficients(c) {
  fixCoefficients();
}

GF256Poly::~GF256Poly() {

}

int GF256Poly::getDegree() {
  return coefficients.size() - 1;
}

bool GF256Poly::isZero() {
  return coefficients[0] == 0;
}

int GF256Poly::getCoefficient(int degree) {
  return coefficients[coefficients.size() - 1 - degree];
}

int GF256Poly::evaluateAt(int a) {
  if (a == 0) {
    return getCoefficient(0);
  }
  int size = coefficients.size();
  if (a == 1) {
    // Just the sum of the coefficients
    int result = 0;
    for (int i = 0; i < size; i++) {
      result = GF256::addOrSubtract(result, coefficients[i]);
    }
    return result;
  }
  int result = coefficients[0];
  for (int i = 1; i < size; i++) {
    result = GF256::addOrSubtract(field.multiply(a, result), coefficients[i]);
  }
  return result;
}

Ref<GF256Poly> GF256Poly::addOrSubtract(Ref<GF256Poly> b) {
  if (&field != &b->field) {
    throw IllegalArgumentException("Fields must be the same");
  }
  if (isZero()) {
    return b;
  }
  if (b->isZero()) {
    return Ref<GF256Poly>(this);
  }

  ArrayRef<int> largerCoefficients = coefficients;
  ArrayRef<int> smallerCoefficients = b->coefficients;
  if (smallerCoefficients.size() > largerCoefficients.size()) {
    ArrayRef<int> tmp(smallerCoefficients);
    smallerCoefficients = largerCoefficients;
    largerCoefficients = tmp;
  }

  ArrayRef<int> sumDiff(new Array<int> (largerCoefficients.size()));

  unsigned lengthDiff = largerCoefficients.size() - smallerCoefficients.size();
  for (unsigned i = 0; i < lengthDiff; i++) {
    sumDiff[i] = largerCoefficients[i];
  }
  for (unsigned i = lengthDiff; i < largerCoefficients.size(); i++) {
    sumDiff[i] = GF256::addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
  }
  return Ref<GF256Poly>(new GF256Poly(field, sumDiff));
}

Ref<GF256Poly> GF256Poly::multiply(Ref<GF256Poly> b) {
  if (&field != &b->field) {
    throw IllegalArgumentException("Fields must be the same");
  }
  if (isZero() || b->isZero()) {
    return field.getZero();
  }
  ArrayRef<int> aCoefficients = coefficients;
  int aLength = aCoefficients.size();
  ArrayRef<int> bCoefficients = b->coefficients;
  int bLength = bCoefficients.size();
  int productLength = aLength + bLength - 1;
  ArrayRef<int> product(new Array<int> (productLength));
  for (int i = 0; i < aLength; i++) {
    int aCoeff = aCoefficients[i];
    for (int j = 0; j < bLength; j++) {
      product[i + j] = GF256::addOrSubtract(product[i + j], field.multiply(aCoeff, bCoefficients[j]));
    }
  }

  return Ref<GF256Poly>(new GF256Poly(field, product));
}

Ref<GF256Poly> GF256Poly::multiply(int scalar) {
  if (scalar == 0) {
    return field.getZero();
  }
  if (scalar == 1) {
    return Ref<GF256Poly>(this);
  }
  int size = coefficients.size();
  ArrayRef<int> product(new Array<int> (size));
  for (int i = 0; i < size; i++) {
    product[i] = field.multiply(coefficients[i], scalar);
  }
  return Ref<GF256Poly>(new GF256Poly(field, product));
}

Ref<GF256Poly> GF256Poly::multiplyByMonomial(int degree, int coefficient) {
  if (degree < 0) {
    throw IllegalArgumentException("Degree must be non-negative");
  }
  if (coefficient == 0) {
    return field.getZero();
  }
  int size = coefficients.size();
  ArrayRef<int> product(new Array<int> (size + degree));
  for (int i = 0; i < size; i++) {
    product[i] = field.multiply(coefficients[i], coefficient);
  }
  return Ref<GF256Poly>(new GF256Poly(field, product));
}

const char *GF256Poly::description() const {
  ostringstream result;
  result << *this;
  return result.str().c_str();
}

ostream& operator<<(ostream& out, const GF256Poly& p) {
  GF256Poly &poly = const_cast<GF256Poly&>(p);
  out << "Poly[" << poly.coefficients.size() << "]";
  if (poly.coefficients.size() > 0) {
    out << "(" << poly.coefficients[0];
    for (unsigned i = 1; i < poly.coefficients.size(); i++) {
      out << "," << poly.coefficients[i];
    }
    out << ")";
  }
  return out;
}

}

// file: zxing/common/reedsolomon/ReedSolomonDecoder.cpp

/*
 *  ReedSolomonDecoder.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 05/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <iostream>

// #include <memory>
// #include <zxing/common/reedsolomon/ReedSolomonDecoder.h>
// #include <zxing/common/reedsolomon/GF256.h>
// #include <zxing/common/reedsolomon/GF256Poly.h>
// #include <zxing/common/reedsolomon/ReedSolomonException.h>
// #include <zxing/common/IllegalArgumentException.h>

using namespace std;

namespace zxing {

ReedSolomonDecoder::ReedSolomonDecoder(GF256 &fld) :
    field(fld) {
}

ReedSolomonDecoder::~ReedSolomonDecoder() {
}

void ReedSolomonDecoder::decode(ArrayRef<int> received, int twoS) {

  Ref<GF256Poly> poly(new GF256Poly(field, received));


#ifdef DEBUG
  cout << "decoding with poly " << *poly << "\n";
#endif

  ArrayRef<int> syndromeCoefficients(new Array<int> (twoS));


#ifdef DEBUG
  cout << "syndromeCoefficients array = " <<
       syndromeCoefficients.array_ << "\n";
#endif

  bool dataMatrix = (&field == &GF256::DATA_MATRIX_FIELD);
  bool noError = true;
  for (int i = 0; i < twoS; i++) {
    int eval = poly->evaluateAt(field.exp(dataMatrix ? i + 1 : i));
    syndromeCoefficients[syndromeCoefficients->size() - 1 - i] = eval;
    if (eval != 0) {
      noError = false;
    }
  }
  if (noError) {
    return;
  }

  Ref<GF256Poly> syndrome(new GF256Poly(field, syndromeCoefficients));
  Ref<GF256Poly> monomial(field.buildMonomial(twoS, 1));
  vector<Ref<GF256Poly> > sigmaOmega(runEuclideanAlgorithm(monomial, syndrome, twoS));
  ArrayRef<int> errorLocations = findErrorLocations(sigmaOmega[0]);
  ArrayRef<int> errorMagitudes = findErrorMagnitudes(sigmaOmega[1], errorLocations, dataMatrix);
  for (unsigned i = 0; i < errorLocations->size(); i++) {
    int position = received->size() - 1 - field.log(errorLocations[i]);
    //TODO: check why the position would be invalid
    if (position < 0 || (size_t)position >= received.size())
      throw IllegalArgumentException("Invalid position (ReedSolomonDecoder)");
    received[position] = GF256::addOrSubtract(received[position], errorMagitudes[i]);
  }
}

vector<Ref<GF256Poly> > ReedSolomonDecoder::runEuclideanAlgorithm(Ref<GF256Poly> a, Ref<GF256Poly> b, int R) {
  // Assume a's degree is >= b's
  if (a->getDegree() < b->getDegree()) {
    Ref<GF256Poly> tmp = a;
    a = b;
    b = tmp;
  }

  Ref<GF256Poly> rLast(a);
  Ref<GF256Poly> r(b);
  Ref<GF256Poly> sLast(field.getOne());
  Ref<GF256Poly> s(field.getZero());
  Ref<GF256Poly> tLast(field.getZero());
  Ref<GF256Poly> t(field.getOne());


  // Run Euclidean algorithm until r's degree is less than R/2
  while (r->getDegree() >= R / 2) {
    Ref<GF256Poly> rLastLast(rLast);
    Ref<GF256Poly> sLastLast(sLast);
    Ref<GF256Poly> tLastLast(tLast);
    rLast = r;
    sLast = s;
    tLast = t;


    // Divide rLastLast by rLast, with quotient q and remainder r
    if (rLast->isZero()) {
      // Oops, Euclidean algorithm already terminated?
      throw ReedSolomonException("r_{i-1} was zero");
    }
    r = rLastLast;
    Ref<GF256Poly> q(field.getZero());
    int denominatorLeadingTerm = rLast->getCoefficient(rLast->getDegree());
    int dltInverse = field.inverse(denominatorLeadingTerm);
    while (r->getDegree() >= rLast->getDegree() && !r->isZero()) {
      int degreeDiff = r->getDegree() - rLast->getDegree();
      int scale = field.multiply(r->getCoefficient(r->getDegree()), dltInverse);
      q = q->addOrSubtract(field.buildMonomial(degreeDiff, scale));
      r = r->addOrSubtract(rLast->multiplyByMonomial(degreeDiff, scale));
    }

    s = q->multiply(sLast)->addOrSubtract(sLastLast);
    t = q->multiply(tLast)->addOrSubtract(tLastLast);
  }

  int sigmaTildeAtZero = t->getCoefficient(0);
  if (sigmaTildeAtZero == 0) {
    throw ReedSolomonException("sigmaTilde(0) was zero");
  }

  int inverse = field.inverse(sigmaTildeAtZero);
  Ref<GF256Poly> sigma(t->multiply(inverse));
  Ref<GF256Poly> omega(r->multiply(inverse));


#ifdef DEBUG
  cout << "t = " << *t << "\n";
  cout << "r = " << *r << "\n";
  cout << "sigma = " << *sigma << "\n";
  cout << "omega = " << *omega << "\n";
#endif

  vector<Ref<GF256Poly> > result(2);
  result[0] = sigma;
  result[1] = omega;
  return result;
}

ArrayRef<int> ReedSolomonDecoder::findErrorLocations(Ref<GF256Poly> errorLocator) {
  // This is a direct application of Chien's search
  int numErrors = errorLocator->getDegree();
  if (numErrors == 1) { // shortcut
    ArrayRef<int> result(1);
    result[0] = errorLocator->getCoefficient(1);
    return result;
  }
  ArrayRef<int> result(numErrors);
  int e = 0;
  for (int i = 1; i < 256 && e < numErrors; i++) {
    // cout << "errorLocator(" << i << ") == " << errorLocator->evaluateAt(i) << "\n";
    if (errorLocator->evaluateAt(i) == 0) {
      result[e] = field.inverse(i);
      e++;
    }
  }
  if (e != numErrors) {
    throw ReedSolomonException("Error locator degree does not match number of roots");
  }
  return result;
}

ArrayRef<int> ReedSolomonDecoder::findErrorMagnitudes(Ref<GF256Poly> errorEvaluator, ArrayRef<int> errorLocations, bool dataMatrix) {
  // This is directly applying Forney's Formula
  int s = errorLocations.size();
  ArrayRef<int> result(s);
  for (int i = 0; i < s; i++) {
    int xiInverse = field.inverse(errorLocations[i]);
    int denominator = 1;
    for (int j = 0; j < s; j++) {
      if (i != j) {
        denominator = field.multiply(denominator, GF256::addOrSubtract(1, field.multiply(errorLocations[j],
                                     xiInverse)));
      }
    }
    result[i] = field.multiply(errorEvaluator->evaluateAt(xiInverse), field.inverse(denominator));

    if (dataMatrix) {
      result[i] = field.multiply(result[i], xiInverse);
	}
  }
  return result;
}
}

// file: zxing/common/reedsolomon/ReedSolomonException.cpp

/*
 *  ReedSolomonException.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 06/05/2008.
 *  Copyright 2008 Google UK. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/common/reedsolomon/ReedSolomonException.h>

namespace zxing {
ReedSolomonException::ReedSolomonException(const char *msg) throw() :
    Exception(msg) {
}
ReedSolomonException::~ReedSolomonException() throw() {
}

}

// file: zxing/datamatrix/DataMatrixReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  DataMatrixReader.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/DataMatrixReader.h>
// #include <zxing/datamatrix/detector/Detector.h>
// #include <iostream>

namespace zxing {
namespace datamatrix {

using namespace std;

DataMatrixReader::DataMatrixReader() :
    decoder_() {
}

Ref<Result> DataMatrixReader::decode(Ref<BinaryBitmap> image, DecodeHints hints) {
  (void)hints;
#ifdef DEBUG
  cout << "decoding image " << image.object_ << ":\n" << flush;
#endif

  Detector detector(image->getBlackMatrix());


#ifdef DEBUG
  cout << "(1) created detector " << &detector << "\n" << flush;
#endif

  Ref<DetectorResult> detectorResult(detector.detect());
#ifdef DEBUG
  cout << "(2) detected, have detectorResult " << detectorResult.object_ << "\n" << flush;
#endif

  std::vector<Ref<ResultPoint> > points(detectorResult->getPoints());


#ifdef DEBUG
  cout << "(3) extracted points " << &points << "\n" << flush;
  cout << "found " << points.size() << " points:\n";
  for (size_t i = 0; i < points.size(); i++) {
    cout << "   " << points[i]->getX() << "," << points[i]->getY() << "\n";
  }
  cout << "bits:\n";
  cout << *(detectorResult->getBits()) << "\n";
#endif

  Ref<DecoderResult> decoderResult(decoder_.decode(detectorResult->getBits()));
#ifdef DEBUG
  cout << "(4) decoded, have decoderResult " << decoderResult.object_ << "\n" << flush;
#endif

  Ref<Result> result(
    new Result(decoderResult->getText(), decoderResult->getRawBytes(), points, BarcodeFormat_DATA_MATRIX));
#ifdef DEBUG
  cout << "(5) created result " << result.object_ << ", returning\n" << flush;
#endif

  return result;
}

DataMatrixReader::~DataMatrixReader() {
}

}
}

// file: zxing/datamatrix/Version.cpp

/*
 *  Version.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/Version.h>
// #include <limits>
// #include <iostream>

namespace zxing {
namespace datamatrix {
using namespace std;

ECB::ECB(int count, int dataCodewords) :
    count_(count), dataCodewords_(dataCodewords) {
}

int ECB::getCount() {
  return count_;
}

int ECB::getDataCodewords() {
  return dataCodewords_;
}

ECBlocks::ECBlocks(int ecCodewords, ECB *ecBlocks) :
    ecCodewords_(ecCodewords), ecBlocks_(1, ecBlocks) {
}

ECBlocks::ECBlocks(int ecCodewords, ECB *ecBlocks1, ECB *ecBlocks2) :
    ecCodewords_(ecCodewords), ecBlocks_(1, ecBlocks1) {
  ecBlocks_.push_back(ecBlocks2);
}

int ECBlocks::getECCodewords() {
  return ecCodewords_;
}

std::vector<ECB*>& ECBlocks::getECBlocks() {
  return ecBlocks_;
}

ECBlocks::~ECBlocks() {
  for (size_t i = 0; i < ecBlocks_.size(); i++) {
    delete ecBlocks_[i];
  }
}

vector<Ref<Version> > Version::VERSIONS;
static int N_VERSIONS = Version::buildVersions();

Version::Version(int versionNumber, int symbolSizeRows, int symbolSizeColumns, int dataRegionSizeRows,
		int dataRegionSizeColumns, ECBlocks* ecBlocks) : versionNumber_(versionNumber),
		symbolSizeRows_(symbolSizeRows), symbolSizeColumns_(symbolSizeColumns),
		dataRegionSizeRows_(dataRegionSizeRows), dataRegionSizeColumns_(dataRegionSizeColumns),
		ecBlocks_(ecBlocks), totalCodewords_(0) {
    // Calculate the total number of codewords
    int total = 0;
    int ecCodewords = ecBlocks_->getECCodewords();
    vector<ECB*> &ecbArray = ecBlocks_->getECBlocks();
    for (unsigned int i = 0; i < ecbArray.size(); i++) {
      ECB *ecBlock = ecbArray[i];
      total += ecBlock->getCount() * (ecBlock->getDataCodewords() + ecCodewords);
    }
    totalCodewords_ = total;
}

Version::~Version() {
    delete ecBlocks_;
}

int Version::getVersionNumber() {
  return versionNumber_;
}

int Version::getSymbolSizeRows() {
  return symbolSizeRows_;
}

int Version::getSymbolSizeColumns() {
  return symbolSizeColumns_;
}

int Version::getDataRegionSizeRows() {
  return dataRegionSizeRows_;
}

int Version::getDataRegionSizeColumns() {
  return dataRegionSizeColumns_;
}

int Version::getTotalCodewords() {
  return totalCodewords_;
}

ECBlocks* Version::getECBlocks() {
  return ecBlocks_;
}

Ref<Version> Version::getVersionForDimensions(int numRows, int numColumns) {
    if ((numRows & 0x01) != 0 || (numColumns & 0x01) != 0) {
      throw ReaderException("Number of rows and columns must be even");
    }

    // TODO(bbrown): This is doing a linear search through the array of versions.
    // If we interleave the rectangular versions with the square versions we could
    // do a binary search.
    for (int i = 0; i < N_VERSIONS; ++i){
      Ref<Version> version(VERSIONS[i]);
      if (version->getSymbolSizeRows() == numRows && version->getSymbolSizeColumns() == numColumns) {
        return version;
      }
    }
    throw ReaderException("Error version not found");
  }

/**
 * See ISO 16022:2006 5.5.1 Table 7
 */
int Version::buildVersions() {
  VERSIONS.push_back(Ref<Version>(new Version(1, 10, 10, 8, 8,
            					  new ECBlocks(5, new ECB(1, 3)))));
  VERSIONS.push_back(Ref<Version>(new Version(2, 12, 12, 10, 10,
            					  new ECBlocks(7, new ECB(1, 5)))));
  VERSIONS.push_back(Ref<Version>(new Version(3, 14, 14, 12, 12,
            					  new ECBlocks(10, new ECB(1, 8)))));
  VERSIONS.push_back(Ref<Version>(new Version(4, 16, 16, 14, 14,
            					  new ECBlocks(12, new ECB(1, 12)))));
  VERSIONS.push_back(Ref<Version>(new Version(5, 18, 18, 16, 16,
            					  new ECBlocks(14, new ECB(1, 18)))));
  VERSIONS.push_back(Ref<Version>(new Version(6, 20, 20, 18, 18,
            					  new ECBlocks(18, new ECB(1, 22)))));
  VERSIONS.push_back(Ref<Version>(new Version(7, 22, 22, 20, 20,
            					  new ECBlocks(20, new ECB(1, 30)))));
  VERSIONS.push_back(Ref<Version>(new Version(8, 24, 24, 22, 22,
            					  new ECBlocks(24, new ECB(1, 36)))));
  VERSIONS.push_back(Ref<Version>(new Version(9, 26, 26, 24, 24,
            					  new ECBlocks(28, new ECB(1, 44)))));
  VERSIONS.push_back(Ref<Version>(new Version(10, 32, 32, 14, 14,
            					  new ECBlocks(36, new ECB(1, 62)))));
  VERSIONS.push_back(Ref<Version>(new Version(11, 36, 36, 16, 16,
            					  new ECBlocks(42, new ECB(1, 86)))));
  VERSIONS.push_back(Ref<Version>(new Version(12, 40, 40, 18, 18,
            					  new ECBlocks(48, new ECB(1, 114)))));
  VERSIONS.push_back(Ref<Version>(new Version(13, 44, 44, 20, 20,
            					  new ECBlocks(56, new ECB(1, 144)))));
  VERSIONS.push_back(Ref<Version>(new Version(14, 48, 48, 22, 22,
            					  new ECBlocks(68, new ECB(1, 174)))));
  VERSIONS.push_back(Ref<Version>(new Version(15, 52, 52, 24, 24,
            					  new ECBlocks(42, new ECB(2, 102)))));
  VERSIONS.push_back(Ref<Version>(new Version(16, 64, 64, 14, 14,
            					  new ECBlocks(56, new ECB(2, 140)))));
  VERSIONS.push_back(Ref<Version>(new Version(17, 72, 72, 16, 16,
            					  new ECBlocks(36, new ECB(4, 92)))));
  VERSIONS.push_back(Ref<Version>(new  Version(18, 80, 80, 18, 18,
            					  new ECBlocks(48, new ECB(4, 114)))));
  VERSIONS.push_back(Ref<Version>(new Version(19, 88, 88, 20, 20,
            					  new ECBlocks(56, new ECB(4, 144)))));
  VERSIONS.push_back(Ref<Version>(new Version(20, 96, 96, 22, 22,
            					  new ECBlocks(68, new ECB(4, 174)))));
  VERSIONS.push_back(Ref<Version>(new Version(21, 104, 104, 24, 24,
            					  new ECBlocks(56, new ECB(6, 136)))));
  VERSIONS.push_back(Ref<Version>(new Version(22, 120, 120, 18, 18,
            					  new ECBlocks(68, new ECB(6, 175)))));
  VERSIONS.push_back(Ref<Version>(new Version(23, 132, 132, 20, 20,
            					  new ECBlocks(62, new ECB(8, 163)))));
  VERSIONS.push_back(Ref<Version>(new Version(24, 144, 144, 22, 22,
            					  new ECBlocks(62, new ECB(8, 156), new ECB(2, 155)))));
  VERSIONS.push_back(Ref<Version>(new Version(25, 8, 18, 6, 16,
            					  new ECBlocks(7, new ECB(1, 5)))));
  VERSIONS.push_back(Ref<Version>(new Version(26, 8, 32, 6, 14,
            					  new ECBlocks(11, new ECB(1, 10)))));
  VERSIONS.push_back(Ref<Version>(new Version(27, 12, 26, 10, 24,
					              new ECBlocks(14, new ECB(1, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(28, 12, 36, 10, 16,
					              new ECBlocks(18, new ECB(1, 22)))));
  VERSIONS.push_back(Ref<Version>(new Version(29, 16, 36, 14, 16,
					              new ECBlocks(24, new ECB(1, 32)))));
  VERSIONS.push_back(Ref<Version>(new Version(30, 16, 48, 14, 22,
					              new ECBlocks(28, new ECB(1, 49)))));
  return VERSIONS.size();
}
}
}

// file: zxing/datamatrix/decoder/BitMatrixParser.cpp

/*
 *  BitMatrixParser.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/decoder/BitMatrixParser.h>
// #include <zxing/common/IllegalArgumentException.h>

// #include <iostream>

namespace zxing {
namespace datamatrix {

int BitMatrixParser::copyBit(size_t x, size_t y, int versionBits) {
  return bitMatrix_->get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
}

BitMatrixParser::BitMatrixParser(Ref<BitMatrix> bitMatrix) : bitMatrix_(NULL),
                                                             parsedVersion_(NULL),
                                                             readBitMatrix_(NULL) {
  size_t dimension = bitMatrix->getDimension();
  if (dimension < 8 || dimension > 144 || (dimension & 0x01) != 0)
    throw ReaderException("Dimension must be even, > 8 < 144");

  parsedVersion_ = readVersion(bitMatrix);
  bitMatrix_ = extractDataRegion(bitMatrix);
  readBitMatrix_ = new BitMatrix(bitMatrix_->getWidth(), bitMatrix_->getHeight());
}

Ref<Version> BitMatrixParser::readVersion(Ref<BitMatrix> bitMatrix) {
  if (parsedVersion_ != 0) {
    return parsedVersion_;
  }

  int numRows = bitMatrix->getHeight();//getDimension();
  int numColumns = bitMatrix->getWidth();//numRows;

  Ref<Version> version = parsedVersion_->getVersionForDimensions(numRows, numColumns);
  if (version != 0) {
    return version;
  }
  throw ReaderException("Couldn't decode version");
}

ArrayRef<unsigned char> BitMatrixParser::readCodewords() {
  	ArrayRef<unsigned char> result(parsedVersion_->getTotalCodewords());
  	int resultOffset = 0;
    int row = 4;
    int column = 0;

    int numRows = bitMatrix_->getHeight();
    int numColumns = bitMatrix_->getWidth();

    bool corner1Read = false;
    bool corner2Read = false;
    bool corner3Read = false;
    bool corner4Read = false;

    // Read all of the codewords
    do {
      // Check the four corner cases
      if ((row == numRows) && (column == 0) && !corner1Read) {
        result[resultOffset++] = (unsigned char) readCorner1(numRows, numColumns);
        row -= 2;
        column +=2;
        corner1Read = true;
      } else if ((row == numRows-2) && (column == 0) && ((numColumns & 0x03) != 0) && !corner2Read) {
        result[resultOffset++] = (unsigned char) readCorner2(numRows, numColumns);
        row -= 2;
        column +=2;
        corner2Read = true;
      } else if ((row == numRows+4) && (column == 2) && ((numColumns & 0x07) == 0) && !corner3Read) {
        result[resultOffset++] = (unsigned char) readCorner3(numRows, numColumns);
        row -= 2;
        column +=2;
        corner3Read = true;
      } else if ((row == numRows-2) && (column == 0) && ((numColumns & 0x07) == 4) && !corner4Read) {
        result[resultOffset++] = (unsigned char) readCorner4(numRows, numColumns);
        row -= 2;
        column +=2;
        corner4Read = true;
      } else {
        // Sweep upward diagonally to the right
        do {
          if ((row < numRows) && (column >= 0) && !readBitMatrix_->get(column, row)) {
            result[resultOffset++] = (unsigned char) readUtah(row, column, numRows, numColumns);
          }
          row -= 2;
          column +=2;
        } while ((row >= 0) && (column < numColumns));
        row += 1;
        column +=3;

        // Sweep downward diagonally to the left
        do {
          if ((row >= 0) && (column < numColumns) && !readBitMatrix_->get(column, row)) {
             result[resultOffset++] = (unsigned char) readUtah(row, column, numRows, numColumns);
          }
          row += 2;
          column -=2;
        } while ((row < numRows) && (column >= 0));
        row += 3;
        column +=1;
      }
    } while ((row < numRows) || (column < numColumns));

    if (resultOffset != parsedVersion_->getTotalCodewords()) {
      throw ReaderException("Did not read all codewords");
    }
    return result;
}

bool BitMatrixParser::readModule(int row, int column, int numRows, int numColumns) {
    // Adjust the row and column indices based on boundary wrapping
    if (row < 0) {
      row += numRows;
      column += 4 - ((numRows + 4) & 0x07);
    }
    if (column < 0) {
      column += numColumns;
      row += 4 - ((numColumns + 4) & 0x07);
    }
    readBitMatrix_->set(column, row);
    return bitMatrix_->get(column, row);
  }

int BitMatrixParser::readUtah(int row, int column, int numRows, int numColumns) {
    int currentByte = 0;
    if (readModule(row - 2, column - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row - 2, column - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row - 1, column - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row - 1, column - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row - 1, column, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row, column - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row, column - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(row, column, numRows, numColumns)) {
      currentByte |= 1;
    }
    return currentByte;
  }

int BitMatrixParser::readCorner1(int numRows, int numColumns) {
    int currentByte = 0;
    if (readModule(numRows - 1, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 1, 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 1, 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(2, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(3, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    return currentByte;
  }

int BitMatrixParser::readCorner2(int numRows, int numColumns) {
    int currentByte = 0;
    if (readModule(numRows - 3, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 2, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 1, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 4, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 3, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    return currentByte;
  }

int BitMatrixParser::readCorner3(int numRows, int numColumns) {
    int currentByte = 0;
    if (readModule(numRows - 1, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 1, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 3, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 3, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    return currentByte;
  }

int BitMatrixParser::readCorner4(int numRows, int numColumns) {
    int currentByte = 0;
    if (readModule(numRows - 3, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 2, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(numRows - 1, 0, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 2, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(0, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(1, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(2, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    currentByte <<= 1;
    if (readModule(3, numColumns - 1, numRows, numColumns)) {
      currentByte |= 1;
    }
    return currentByte;
  }

Ref<BitMatrix> BitMatrixParser::extractDataRegion(Ref<BitMatrix> bitMatrix) {
    int symbolSizeRows = parsedVersion_->getSymbolSizeRows();
    int symbolSizeColumns = parsedVersion_->getSymbolSizeColumns();

    if ((int)bitMatrix->getHeight() != symbolSizeRows) {
      throw IllegalArgumentException("Dimension of bitMatrix must match the version size");
    }

    int dataRegionSizeRows = parsedVersion_->getDataRegionSizeRows();
    int dataRegionSizeColumns = parsedVersion_->getDataRegionSizeColumns();

    int numDataRegionsRow = symbolSizeRows / dataRegionSizeRows;
    int numDataRegionsColumn = symbolSizeColumns / dataRegionSizeColumns;

    int sizeDataRegionRow = numDataRegionsRow * dataRegionSizeRows;
    int sizeDataRegionColumn = numDataRegionsColumn * dataRegionSizeColumns;

    Ref<BitMatrix> bitMatrixWithoutAlignment(new BitMatrix(sizeDataRegionColumn, sizeDataRegionRow));
    for (int dataRegionRow = 0; dataRegionRow < numDataRegionsRow; ++dataRegionRow) {
      int dataRegionRowOffset = dataRegionRow * dataRegionSizeRows;
      for (int dataRegionColumn = 0; dataRegionColumn < numDataRegionsColumn; ++dataRegionColumn) {
        int dataRegionColumnOffset = dataRegionColumn * dataRegionSizeColumns;
        for (int i = 0; i < dataRegionSizeRows; ++i) {
          int readRowOffset = dataRegionRow * (dataRegionSizeRows + 2) + 1 + i;
          int writeRowOffset = dataRegionRowOffset + i;
          for (int j = 0; j < dataRegionSizeColumns; ++j) {
            int readColumnOffset = dataRegionColumn * (dataRegionSizeColumns + 2) + 1 + j;
            if (bitMatrix->get(readColumnOffset, readRowOffset)) {
              int writeColumnOffset = dataRegionColumnOffset + j;
              bitMatrixWithoutAlignment->set(writeColumnOffset, writeRowOffset);
            }
          }
        }
      }
    }
    return bitMatrixWithoutAlignment;
}

}
}

// file: zxing/datamatrix/decoder/DataBlock.cpp

/*
 *  DataBlock.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/decoder/DataBlock.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {
namespace datamatrix {

using namespace std;

DataBlock::DataBlock(int numDataCodewords, ArrayRef<unsigned char> codewords) :
    numDataCodewords_(numDataCodewords), codewords_(codewords) {
}

int DataBlock::getNumDataCodewords() {
  return numDataCodewords_;
}

ArrayRef<unsigned char> DataBlock::getCodewords() {
  return codewords_;
}

std::vector<Ref<DataBlock> > DataBlock::getDataBlocks(ArrayRef<unsigned char> rawCodewords, Version *version) {
  // Figure out the number and size of data blocks used by this version and
  // error correction level
  ECBlocks* ecBlocks = version->getECBlocks();

  // First count the total number of data blocks
  int totalBlocks = 0;
  vector<ECB*> ecBlockArray = ecBlocks->getECBlocks();
  for (size_t i = 0; i < ecBlockArray.size(); i++) {
    totalBlocks += ecBlockArray[i]->getCount();
  }

  // Now establish DataBlocks of the appropriate size and number of data codewords
  std::vector<Ref<DataBlock> > result(totalBlocks);
  int numResultBlocks = 0;
  for (size_t j = 0; j < ecBlockArray.size(); j++) {
    ECB *ecBlock = ecBlockArray[j];
    for (int i = 0; i < ecBlock->getCount(); i++) {
      int numDataCodewords = ecBlock->getDataCodewords();
      int numBlockCodewords = ecBlocks->getECCodewords() + numDataCodewords;
      ArrayRef<unsigned char> buffer(numBlockCodewords);
      Ref<DataBlock> blockRef(new DataBlock(numDataCodewords, buffer));
      result[numResultBlocks++] = blockRef;
    }
  }

  // All blocks have the same amount of data, except that the last n
  // (where n may be 0) have 1 more byte. Figure out where these start.
  int shorterBlocksTotalCodewords = result[0]->codewords_.size();
  int longerBlocksStartAt = result.size() - 1;
  while (longerBlocksStartAt >= 0) {
    int numCodewords = result[longerBlocksStartAt]->codewords_.size();
    if (numCodewords == shorterBlocksTotalCodewords) {
      break;
    }
    if (numCodewords != shorterBlocksTotalCodewords + 1) {
      throw IllegalArgumentException("Data block sizes differ by more than 1");
    }
    longerBlocksStartAt--;
  }
  longerBlocksStartAt++;

  int shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks->getECCodewords();
  // The last elements of result may be 1 element longer;
  // first fill out as many elements as all of them have
  int rawCodewordsOffset = 0;
  for (int i = 0; i < shorterBlocksNumDataCodewords; i++) {
    for (int j = 0; j < numResultBlocks; j++) {
      result[j]->codewords_[i] = rawCodewords[rawCodewordsOffset++];
    }
  }
  // Fill out the last data block in the longer ones
  for (int j = longerBlocksStartAt; j < numResultBlocks; j++) {
    result[j]->codewords_[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
  }
  // Now add in error correction blocks
  int max = result[0]->codewords_.size();
  for (int i = shorterBlocksNumDataCodewords; i < max; i++) {
    for (int j = 0; j < numResultBlocks; j++) {
      int iOffset = j < longerBlocksStartAt ? i : i + 1;
      result[j]->codewords_[iOffset] = rawCodewords[rawCodewordsOffset++];
    }
  }

  if ((size_t)rawCodewordsOffset != rawCodewords.size()) {
    throw IllegalArgumentException("rawCodewordsOffset != rawCodewords.length");
  }

  return result;
}

}
}

// file: zxing/datamatrix/decoder/DecodedBitStreamParser.cpp

/*
 *  DecodedBitStreamParser.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/FormatException.h>
// #include <zxing/datamatrix/decoder/DecodedBitStreamParser.h>
// #include <iostream>
// #include <zxing/common/DecoderResult.h>

namespace zxing {
namespace datamatrix {

using namespace std;

const char DecodedBitStreamParser::C40_BASIC_SET_CHARS[] = {
    '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
};

const char DecodedBitStreamParser::C40_SHIFT2_SET_CHARS[] = {
    '!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',', '-', '.',
    '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_'
};

const char DecodedBitStreamParser::TEXT_BASIC_SET_CHARS[] = {
    '*', '*', '*', ' ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
    'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
};

const char DecodedBitStreamParser::TEXT_SHIFT3_SET_CHARS[] = {
    '\'', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
    'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '{', '|', '}', '~', (char) 127
};

Ref<DecoderResult> DecodedBitStreamParser::decode(ArrayRef<unsigned char> bytes) {
  Ref<BitSource> bits(new BitSource(bytes));
  ostringstream result;
  ostringstream resultTrailer;
  vector<unsigned char> byteSegments;
  int mode = ASCII_ENCODE;
  do {
    if (mode == ASCII_ENCODE) {
      mode = decodeAsciiSegment(bits, result, resultTrailer);
    } else {
      switch (mode) {
        case C40_ENCODE:
          decodeC40Segment(bits, result);
          break;
        case TEXT_ENCODE:
          decodeTextSegment(bits, result);
          break;
        case ANSIX12_ENCODE:
          decodeAnsiX12Segment(bits, result);
          break;
        case EDIFACT_ENCODE:
          decodeEdifactSegment(bits, result);
          break;
        case BASE256_ENCODE:
          decodeBase256Segment(bits, result, byteSegments);
          break;
        default:
          throw FormatException("Unsupported mode indicator");
      }
      mode = ASCII_ENCODE;
    }
  } while (mode != PAD_ENCODE && bits->available() > 0);

  if (resultTrailer.str().size() > 0) {
    result << resultTrailer.str();
  }
  ArrayRef<unsigned char> rawBytes(bytes);
  Ref<String> text(new String(result.str()));
  return Ref<DecoderResult>(new DecoderResult(rawBytes, text));
}

int DecodedBitStreamParser::decodeAsciiSegment(Ref<BitSource> bits, ostringstream & result,
  ostringstream & resultTrailer) {
  bool upperShift = false;
  do {
    int oneByte = bits->readBits(8);
    if (oneByte == 0) {
      throw FormatException("Not enough bits to decode");
    } else if (oneByte <= 128) {  // ASCII data (ASCII value + 1)
      oneByte = upperShift ? (oneByte + 128) : oneByte;
      // upperShift = false;
      result << (char) (oneByte - 1);
      return ASCII_ENCODE;
    } else if (oneByte == 129) {  // Pad
      return PAD_ENCODE;
    } else if (oneByte <= 229) {  // 2-digit data 00-99 (Numeric Value + 130)
      int value = oneByte - 130;
      if (value < 10) { // padd with '0' for single digit values
        result << '0';
      }
      result << value;
    } else if (oneByte == 230) {  // Latch to C40 encodation
      return C40_ENCODE;
    } else if (oneByte == 231) {  // Latch to Base 256 encodation
      return BASE256_ENCODE;
    } else if (oneByte == 232) {  // FNC1
      result << ((char) 29); // translate as ASCII 29
    } else if (oneByte == 233 || oneByte == 234) {
      // Structured Append, Reader Programming
      // Ignore these symbols for now
      // throw FormatException.getInstance();
    } else if (oneByte == 235) {  // Upper Shift (shift to Extended ASCII)
      upperShift = true;
    } else if (oneByte == 236) {  // 05 Macro
        result << ("[)>RS05GS");
        resultTrailer << ("RSEOT");
    } else if (oneByte == 237) {  // 06 Macro
      result << ("[)>RS06GS");
      resultTrailer <<  ("RSEOT");
    } else if (oneByte == 238) {  // Latch to ANSI X12 encodation
      return ANSIX12_ENCODE;
    } else if (oneByte == 239) {  // Latch to Text encodation
      return TEXT_ENCODE;
    } else if (oneByte == 240) {  // Latch to EDIFACT encodation
      return EDIFACT_ENCODE;
    } else if (oneByte == 241) {  // ECI Character
      // TODO(bbrown): I think we need to support ECI
      // throw FormatException.getInstance();
      // Ignore this symbol for now
    } else if (oneByte >= 242) { // Not to be used in ASCII encodation
      // ... but work around encoders that end with 254, latch back to ASCII
      if (oneByte == 254 && bits->available() == 0) {
        // Ignore
      } else {
        throw FormatException("Not to be used in ASCII encodation");
      }
    }
  } while (bits->available() > 0);
  return ASCII_ENCODE;
}

void DecodedBitStreamParser::decodeC40Segment(Ref<BitSource> bits, ostringstream & result) {
  // Three C40 values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1
  // TODO(bbrown): The Upper Shift with C40 doesn't work in the 4 value scenario all the time
  bool upperShift = false;

  int* cValues = new int[3];
  int shift = 0;
  do {
    // If there is only one byte left then it will be encoded as ASCII
    if (bits->available() == 8) {
      return;
    }
    int firstByte = bits->readBits(8);
    if (firstByte == 254) {  // Unlatch codeword
      return;
    }

    parseTwoBytes(firstByte, bits->readBits(8), cValues);

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      switch (shift) {
        case 0:
          if (cValue < 3) {
            shift = cValue + 1;
          } else {
            if (upperShift) {
              result << (char) (C40_BASIC_SET_CHARS[cValue] + 128);
              upperShift = false;
            } else {
              result << C40_BASIC_SET_CHARS[cValue];
            }
          }
          break;
        case 1:
          if (upperShift) {
            result << (char) (cValue + 128);
            upperShift = false;
          } else {
            result << (char) cValue;
          }
          shift = 0;
          break;
        case 2:
          if (cValue < 27) {
            if (upperShift) {
              result << (char) (C40_SHIFT2_SET_CHARS[cValue] + 128);
              upperShift = false;
            } else {
              result << C40_SHIFT2_SET_CHARS[cValue];
            }
          } else if (cValue == 27) {  // FNC1
            result << ((char) 29); // translate as ASCII 29
          } else if (cValue == 30) {  // Upper Shift
            upperShift = true;
          } else {
            throw FormatException("decodeC40Segment: Upper Shift");
          }
          shift = 0;
          break;
        case 3:
          if (upperShift) {
            result << (char) (cValue + 224);
            upperShift = false;
          } else {
            result << (char) (cValue + 96);
          }
          shift = 0;
          break;
        default:
          throw FormatException("decodeC40Segment: no case");
      }
    }
  } while (bits->available() > 0);
}

void DecodedBitStreamParser::decodeTextSegment(Ref<BitSource> bits, ostringstream & result) {
  // Three Text values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1
  // TODO(bbrown): The Upper Shift with Text doesn't work in the 4 value scenario all the time
  bool upperShift = false;

  int* cValues = new int[3];
  int shift = 0;
  do {
    // If there is only one byte left then it will be encoded as ASCII
    if (bits->available() == 8) {
      return;
    }
    int firstByte = bits->readBits(8);
    if (firstByte == 254) {  // Unlatch codeword
      return;
    }

    parseTwoBytes(firstByte, bits->readBits(8), cValues);

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      switch (shift) {
        case 0:
          if (cValue < 3) {
            shift = cValue + 1;
          } else {
            if (upperShift) {
              result << (char) (TEXT_BASIC_SET_CHARS[cValue] + 128);
              upperShift = false;
            } else {
              result << (TEXT_BASIC_SET_CHARS[cValue]);
            }
          }
          break;
        case 1:
          if (upperShift) {
            result << (char) (cValue + 128);
            upperShift = false;
          } else {
            result << (char) (cValue);
          }
          shift = 0;
          break;
        case 2:
          // Shift 2 for Text is the same encoding as C40
          if (cValue < 27) {
            if (upperShift) {
              result << (char) (C40_SHIFT2_SET_CHARS[cValue] + 128);
              upperShift = false;
            } else {
              result << (C40_SHIFT2_SET_CHARS[cValue]);
            }
          } else if (cValue == 27) {  // FNC1
            result << ((char) 29); // translate as ASCII 29
          } else if (cValue == 30) {  // Upper Shift
            upperShift = true;
          } else {
            throw FormatException("decodeTextSegment: Upper Shift");
          }
          shift = 0;
          break;
        case 3:
          if (upperShift) {
            result << (char) (TEXT_SHIFT3_SET_CHARS[cValue] + 128);
            upperShift = false;
          } else {
            result << (TEXT_SHIFT3_SET_CHARS[cValue]);
          }
          shift = 0;
          break;
        default:
          throw FormatException("decodeTextSegment: no case");
      }
    }
  } while (bits->available() > 0);
}

void DecodedBitStreamParser::decodeAnsiX12Segment(Ref<BitSource> bits, ostringstream & result) {
  // Three ANSI X12 values are encoded in a 16-bit value as
  // (1600 * C1) + (40 * C2) + C3 + 1

  int* cValues = new int[3];
  do {
    // If there is only one byte left then it will be encoded as ASCII
    if (bits->available() == 8) {
      return;
    }
    int firstByte = bits->readBits(8);
    if (firstByte == 254) {  // Unlatch codeword
      return;
    }

    parseTwoBytes(firstByte, bits->readBits(8), cValues);

    for (int i = 0; i < 3; i++) {
      int cValue = cValues[i];
      if (cValue == 0) {  // X12 segment terminator <CR>
        result << '\r';
      } else if (cValue == 1) {  // X12 segment separator *
        result << '*';
      } else if (cValue == 2) {  // X12 sub-element separator >
        result << '>';
      } else if (cValue == 3) {  // space
        result << ' ';
      } else if (cValue < 14) {  // 0 - 9
        result << (char) (cValue + 44);
      } else if (cValue < 40) {  // A - Z
        result << (char) (cValue + 51);
      } else {
        throw FormatException("decodeAnsiX12Segment: no case");
      }
    }
  } while (bits->available() > 0);
}

void DecodedBitStreamParser::parseTwoBytes(int firstByte, int secondByte, int*& result) {
  int fullBitValue = (firstByte << 8) + secondByte - 1;
  int temp = fullBitValue / 1600;
  result[0] = temp;
  fullBitValue -= temp * 1600;
  temp = fullBitValue / 40;
  result[1] = temp;
  result[2] = fullBitValue - temp * 40;
}

void DecodedBitStreamParser::decodeEdifactSegment(Ref<BitSource> bits, ostringstream & result) {
  bool unlatch = false;
  do {
    // If there is only two or less bytes left then it will be encoded as ASCII
    if (bits->available() <= 16) {
      return;
    }

    for (int i = 0; i < 4; i++) {
      int edifactValue = bits->readBits(6);

      // Check for the unlatch character
      if (edifactValue == 0x2B67) {  // 011111
        unlatch = true;
        // If we encounter the unlatch code then continue reading because the Codeword triple
        // is padded with 0's
      }

      if (!unlatch) {
        if ((edifactValue & 0x20) == 0) {  // no 1 in the leading (6th) bit
          edifactValue |= 0x40;  // Add a leading 01 to the 6 bit binary value
        }
        result << (char)(edifactValue);
      }
    }
  } while (!unlatch && bits->available() > 0);
}

void DecodedBitStreamParser::decodeBase256Segment(Ref<BitSource> bits, ostringstream& result, vector<unsigned char> byteSegments) {
  // Figure out how long the Base 256 Segment is.
  int codewordPosition = 1 + bits->getByteOffset(); // position is 1-indexed
  int d1 = unrandomize255State(bits->readBits(8), codewordPosition++);
  int count;
  if (d1 == 0) {  // Read the remainder of the symbol
    count = bits->available() / 8;
  } else if (d1 < 250) {
    count = d1;
  } else {
    count = 250 * (d1 - 249) + unrandomize255State(bits->readBits(8), codewordPosition++);
  }

  // We're seeing NegativeArraySizeException errors from users.
  if (count < 0) {
    throw FormatException("NegativeArraySizeException");
  }

  unsigned char* bytes = new unsigned char[count];
  for (int i = 0; i < count; i++) {
    // Have seen this particular error in the wild, such as at
    // http://www.bcgen.com/demo/IDAutomationStreamingDataMatrix.aspx?MODE=3&D=Fred&PFMT=3&PT=F&X=0.3&O=0&LM=0.2
    if (bits->available() < 8) {
      throw FormatException("byteSegments");
    }
    bytes[i] = unrandomize255State(bits->readBits(8), codewordPosition++);
    byteSegments.push_back(bytes[i]);
    result << (char)bytes[i];
  }
}
}
}


// file: zxing/datamatrix/decoder/Decoder.cpp

/*
 *  Decoder.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/decoder/Decoder.h>
// #include <zxing/datamatrix/decoder/BitMatrixParser.h>
// #include <zxing/datamatrix/decoder/DataBlock.h>
// #include <zxing/datamatrix/decoder/DecodedBitStreamParser.h>
// #include <zxing/datamatrix/Version.h>
// #include <zxing/ReaderException.h>
// #include <zxing/common/reedsolomon/ReedSolomonException.h>

namespace zxing {
namespace datamatrix {

using namespace std;

Decoder::Decoder() :
    rsDecoder_(GF256::DATA_MATRIX_FIELD) {
}


void Decoder::correctErrors(ArrayRef<unsigned char> codewordBytes, int numDataCodewords) {
  int numCodewords = codewordBytes->size();
  ArrayRef<int> codewordInts(numCodewords);
  for (int i = 0; i < numCodewords; i++) {
    codewordInts[i] = codewordBytes[i] & 0xff;
  }
  int numECCodewords = numCodewords - numDataCodewords;
  try {
    rsDecoder_.decode(codewordInts, numECCodewords);
  } catch (ReedSolomonException const& ex) {
    ReaderException rex(ex.what());
    throw rex;
  }
  // Copy back into array of bytes -- only need to worry about the bytes that were data
  // We don't care about errors in the error-correction codewords
  for (int i = 0; i < numDataCodewords; i++) {
    codewordBytes[i] = (unsigned char)codewordInts[i];
  }
}

Ref<DecoderResult> Decoder::decode(Ref<BitMatrix> bits) {
  // Construct a parser and read version, error-correction level
  BitMatrixParser parser(bits);
  Version *version = parser.readVersion(bits);

  // Read codewords
  ArrayRef<unsigned char> codewords(parser.readCodewords());
  // Separate into data blocks
  std::vector<Ref<DataBlock> > dataBlocks = DataBlock::getDataBlocks(codewords, version);

  int dataBlocksCount = dataBlocks.size();

  // Count total number of data bytes
  int totalBytes = 0;
  for (int i = 0; i < dataBlocksCount; i++) {
    totalBytes += dataBlocks[i]->getNumDataCodewords();
  }
  ArrayRef<unsigned char> resultBytes(totalBytes);

  // Error-correct and copy data blocks together into a stream of bytes
  for (int j = 0; j < dataBlocksCount; j++) {
    Ref<DataBlock> dataBlock(dataBlocks[j]);
    ArrayRef<unsigned char> codewordBytes = dataBlock->getCodewords();
    int numDataCodewords = dataBlock->getNumDataCodewords();
    correctErrors(codewordBytes, numDataCodewords);
    for (int i = 0; i < numDataCodewords; i++) {
      // De-interlace data blocks.
      resultBytes[i * dataBlocksCount + j] = codewordBytes[i];
    }
  }
  // Decode the contents of that stream of bytes
  DecodedBitStreamParser decodedBSParser;
  return Ref<DecoderResult> (decodedBSParser.decode(resultBytes));
}
}
}

// file: zxing/datamatrix/detector/CornerPoint.cpp

/*
 *  CornerPoint.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/datamatrix/detector/CornerPoint.h>


namespace zxing {
	namespace datamatrix {

		using namespace std;

		CornerPoint::CornerPoint(float posX, float posY) :
		  ResultPoint(posX,posY), counter_(0) {
		}

		int CornerPoint::getCount() const {
			return counter_;
		}

		void CornerPoint::incrementCount() {
			counter_++;
		}

		bool CornerPoint::equals(Ref<CornerPoint> other) const {
			return posX_ == other->getX() && posY_ == other->getY();
		}

	}
}

// file: zxing/datamatrix/detector/Detector.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Detector.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/ResultPoint.h>
// #include <zxing/common/GridSampler.h>
// #include <zxing/datamatrix/detector/Detector.h>
// #include <cmath>
// #include <sstream>
// #include <cstdlib>

namespace zxing {
namespace datamatrix {

using namespace std;

ResultPointsAndTransitions::ResultPointsAndTransitions() {
  Ref<ResultPoint> ref(new ResultPoint(0, 0));
  from_ = ref;
  to_ = ref;
  transitions_ = 0;
}

ResultPointsAndTransitions::ResultPointsAndTransitions(Ref<ResultPoint> from, Ref<ResultPoint> to,
    int transitions)
    : to_(to), from_(from), transitions_(transitions) {
}

Ref<ResultPoint> ResultPointsAndTransitions::getFrom() {
  return from_;
}

Ref<ResultPoint> ResultPointsAndTransitions::getTo() {
  return to_;
}

int ResultPointsAndTransitions::getTransitions() {
  return transitions_;
}

Detector::Detector(Ref<BitMatrix> image)
    : image_(image) {
}

Ref<BitMatrix> Detector::getImage() {
  return image_;
}

Ref<DetectorResult> Detector::detect() {
  Ref<WhiteRectangleDetector> rectangleDetector_(new WhiteRectangleDetector(image_));
  std::vector<Ref<ResultPoint> > ResultPoints = rectangleDetector_->detect();
  Ref<ResultPoint> pointA = ResultPoints[0];
  Ref<ResultPoint> pointB = ResultPoints[1];
  Ref<ResultPoint> pointC = ResultPoints[2];
  Ref<ResultPoint> pointD = ResultPoints[3];

  // Point A and D are across the diagonal from one another,
  // as are B and C. Figure out which are the solid black lines
  // by counting transitions
  std::vector<Ref<ResultPointsAndTransitions> > transitions(4);
  transitions[0].reset(transitionsBetween(pointA, pointB));
  transitions[1].reset(transitionsBetween(pointA, pointC));
  transitions[2].reset(transitionsBetween(pointB, pointD));
  transitions[3].reset(transitionsBetween(pointC, pointD));
  insertionSort(transitions);

  // Sort by number of transitions. First two will be the two solid sides; last two
  // will be the two alternating black/white sides
  Ref<ResultPointsAndTransitions> lSideOne(transitions[0]);
  Ref<ResultPointsAndTransitions> lSideTwo(transitions[1]);

  // Figure out which point is their intersection by tallying up the number of times we see the
  // endpoints in the four endpoints. One will show up twice.
  Ref<ResultPoint> maybeTopLeft;
  Ref<ResultPoint> bottomLeft;
  Ref<ResultPoint> maybeBottomRight;
  if (lSideOne->getFrom()->equals(lSideOne->getTo())) {
    bottomLeft = lSideOne->getFrom();
    maybeTopLeft = lSideTwo->getFrom();
    maybeBottomRight = lSideTwo->getTo();
  } else if (lSideOne->getFrom()->equals(lSideTwo->getFrom())) {
    bottomLeft = lSideOne->getFrom();
    maybeTopLeft = lSideOne->getTo();
    maybeBottomRight = lSideTwo->getTo();
  } else if (lSideOne->getFrom()->equals(lSideTwo->getTo())) {
    bottomLeft = lSideOne->getFrom();
    maybeTopLeft = lSideOne->getTo();
    maybeBottomRight = lSideTwo->getFrom();
  } else if (lSideOne->getTo()->equals(lSideTwo->getFrom())) {
    bottomLeft = lSideOne->getTo();
    maybeTopLeft = lSideOne->getFrom();
    maybeBottomRight = lSideTwo->getTo();
  } else if (lSideOne->getTo()->equals(lSideTwo->getTo())) {
    bottomLeft = lSideOne->getTo();
    maybeTopLeft = lSideOne->getFrom();
    maybeBottomRight = lSideTwo->getFrom();
  } else {
    bottomLeft = lSideTwo->getFrom();
    maybeTopLeft = lSideOne->getTo();
    maybeBottomRight = lSideOne->getFrom();
  }

  // Bottom left is correct but top left and bottom right might be switched
  std::vector<Ref<ResultPoint> > corners(3);
  corners[0].reset(maybeTopLeft);
  corners[1].reset(bottomLeft);
  corners[2].reset(maybeBottomRight);

  // Use the dot product trick to sort them out
  ResultPoint::orderBestPatterns(corners);

  // Now we know which is which:
  Ref<ResultPoint> bottomRight(corners[0]);
  bottomLeft = corners[1];
  Ref<ResultPoint> topLeft(corners[2]);

  // Which point didn't we find in relation to the "L" sides? that's the top right corner
  Ref<ResultPoint> topRight;
  if (!(pointA->equals(bottomRight) || pointA->equals(bottomLeft) || pointA->equals(topLeft))) {
    topRight = pointA;
  } else if (!(pointB->equals(bottomRight) || pointB->equals(bottomLeft)
      || pointB->equals(topLeft))) {
    topRight = pointB;
  } else if (!(pointC->equals(bottomRight) || pointC->equals(bottomLeft)
      || pointC->equals(topLeft))) {
    topRight = pointC;
  } else {
    topRight = pointD;
  }

  // Next determine the dimension by tracing along the top or right side and counting black/white
  // transitions. Since we start inside a black module, we should see a number of transitions
  // equal to 1 less than the code dimension. Well, actually 2 less, because we are going to
  // end on a black module:

  // The top right point is actually the corner of a module, which is one of the two black modules
  // adjacent to the white module at the top right. Tracing to that corner from either the top left
  // or bottom right should work here.

  int dimensionTop = transitionsBetween(topLeft, topRight)->getTransitions();
  int dimensionRight = transitionsBetween(bottomRight, topRight)->getTransitions();

  //dimensionTop++;
  if ((dimensionTop & 0x01) == 1) {
    // it can't be odd, so, round... up?
    dimensionTop++;
  }
  dimensionTop += 2;

  //dimensionRight++;
  if ((dimensionRight & 0x01) == 1) {
    // it can't be odd, so, round... up?
    dimensionRight++;
  }
  dimensionRight += 2;

  Ref<BitMatrix> bits;
  Ref<PerspectiveTransform> transform;
  Ref<ResultPoint> correctedTopRight;


  // Rectanguar symbols are 6x16, 6x28, 10x24, 10x32, 14x32, or 14x44. If one dimension is more
  // than twice the other, it's certainly rectangular, but to cut a bit more slack we accept it as
  // rectangular if the bigger side is at least 7/4 times the other:
  if (4 * dimensionTop >= 7 * dimensionRight || 4 * dimensionRight >= 7 * dimensionTop) {
    // The matrix is rectangular
    correctedTopRight = correctTopRightRectangular(bottomLeft, bottomRight, topLeft, topRight,
        dimensionTop, dimensionRight);
    if (correctedTopRight == NULL) {
      correctedTopRight = topRight;
    }

    dimensionTop = transitionsBetween(topLeft, correctedTopRight)->getTransitions();
    dimensionRight = transitionsBetween(bottomRight, correctedTopRight)->getTransitions();

    if ((dimensionTop & 0x01) == 1) {
      // it can't be odd, so, round... up?
      dimensionTop++;
    }

    if ((dimensionRight & 0x01) == 1) {
      // it can't be odd, so, round... up?
      dimensionRight++;
    }

    transform = createTransform(topLeft, correctedTopRight, bottomLeft, bottomRight, dimensionTop,
        dimensionRight);
    bits = sampleGrid(image_, dimensionTop, dimensionRight, transform);

  } else {
    // The matrix is square
    int dimension = min(dimensionRight, dimensionTop);

    // correct top right point to match the white module
    correctedTopRight = correctTopRight(bottomLeft, bottomRight, topLeft, topRight, dimension);
    if (correctedTopRight == NULL) {
      correctedTopRight = topRight;
    }

    // Redetermine the dimension using the corrected top right point
    int dimensionCorrected = max(transitionsBetween(topLeft, correctedTopRight)->getTransitions(),
        transitionsBetween(bottomRight, correctedTopRight)->getTransitions());
    dimensionCorrected++;
    if ((dimensionCorrected & 0x01) == 1) {
      dimensionCorrected++;
    }

    transform = createTransform(topLeft, correctedTopRight, bottomLeft, bottomRight,
        dimensionCorrected, dimensionCorrected);
    bits = sampleGrid(image_, dimensionCorrected, dimensionCorrected, transform);
  }

  std::vector<Ref<ResultPoint> > points(4);
  points[0].reset(topLeft);
  points[1].reset(bottomLeft);
  points[2].reset(correctedTopRight);
  points[3].reset(bottomRight);
  Ref<DetectorResult> detectorResult(new DetectorResult(bits, points, transform));
  return detectorResult;
}

/**
 * Calculates the position of the white top right module using the output of the rectangle detector
 * for a rectangular matrix
 */
Ref<ResultPoint> Detector::correctTopRightRectangular(Ref<ResultPoint> bottomLeft,
    Ref<ResultPoint> bottomRight, Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight,
    int dimensionTop, int dimensionRight) {

  float corr = distance(bottomLeft, bottomRight) / (float) dimensionTop;
  int norm = distance(topLeft, topRight);
  float cos = (topRight->getX() - topLeft->getX()) / norm;
  float sin = (topRight->getY() - topLeft->getY()) / norm;

  Ref<ResultPoint> c1(
      new ResultPoint(topRight->getX() + corr * cos, topRight->getY() + corr * sin));

  corr = distance(bottomLeft, topLeft) / (float) dimensionRight;
  norm = distance(bottomRight, topRight);
  cos = (topRight->getX() - bottomRight->getX()) / norm;
  sin = (topRight->getY() - bottomRight->getY()) / norm;

  Ref<ResultPoint> c2(
      new ResultPoint(topRight->getX() + corr * cos, topRight->getY() + corr * sin));

  if (!isValid(c1)) {
    if (isValid(c2)) {
      return c2;
    }
    return Ref<ResultPoint>(NULL);
  }
  if (!isValid(c2)) {
    return c1;
  }

  int l1 = abs(dimensionTop - transitionsBetween(topLeft, c1)->getTransitions())
      + abs(dimensionRight - transitionsBetween(bottomRight, c1)->getTransitions());
  int l2 = abs(dimensionTop - transitionsBetween(topLeft, c2)->getTransitions())
      + abs(dimensionRight - transitionsBetween(bottomRight, c2)->getTransitions());

  return l1 <= l2 ? c1 : c2;
}

/**
 * Calculates the position of the white top right module using the output of the rectangle detector
 * for a square matrix
 */
Ref<ResultPoint> Detector::correctTopRight(Ref<ResultPoint> bottomLeft,
    Ref<ResultPoint> bottomRight, Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight,
    int dimension) {

  float corr = distance(bottomLeft, bottomRight) / (float) dimension;
  int norm = distance(topLeft, topRight);
  float cos = (topRight->getX() - topLeft->getX()) / norm;
  float sin = (topRight->getY() - topLeft->getY()) / norm;

  Ref<ResultPoint> c1(
      new ResultPoint(topRight->getX() + corr * cos, topRight->getY() + corr * sin));

  corr = distance(bottomLeft, bottomRight) / (float) dimension;
  norm = distance(bottomRight, topRight);
  cos = (topRight->getX() - bottomRight->getX()) / norm;
  sin = (topRight->getY() - bottomRight->getY()) / norm;

  Ref<ResultPoint> c2(
      new ResultPoint(topRight->getX() + corr * cos, topRight->getY() + corr * sin));

  if (!isValid(c1)) {
    if (isValid(c2)) {
      return c2;
    }
    return Ref<ResultPoint>(NULL);
  }
  if (!isValid(c2)) {
    return c1;
  }

  int l1 = abs(
      transitionsBetween(topLeft, c1)->getTransitions()
          - transitionsBetween(bottomRight, c1)->getTransitions());
  int l2 = abs(
      transitionsBetween(topLeft, c2)->getTransitions()
          - transitionsBetween(bottomRight, c2)->getTransitions());

  return l1 <= l2 ? c1 : c2;
}

bool Detector::isValid(Ref<ResultPoint> p) {
  return p->getX() >= 0 && p->getX() < image_->getWidth() && p->getY() > 0
      && p->getY() < image_->getHeight();
}

// L2 distance
int Detector::distance(Ref<ResultPoint> a, Ref<ResultPoint> b) {
  return round(
      (float) sqrt(
          (double) (a->getX() - b->getX()) * (a->getX() - b->getX())
              + (a->getY() - b->getY()) * (a->getY() - b->getY())));
}

Ref<ResultPointsAndTransitions> Detector::transitionsBetween(Ref<ResultPoint> from,
    Ref<ResultPoint> to) {
  // See QR Code Detector, sizeOfBlackWhiteBlackRun()
  int fromX = (int) from->getX();
  int fromY = (int) from->getY();
  int toX = (int) to->getX();
  int toY = (int) to->getY();
  bool steep = abs(toY - fromY) > abs(toX - fromX);
  if (steep) {
    int temp = fromX;
    fromX = fromY;
    fromY = temp;
    temp = toX;
    toX = toY;
    toY = temp;
  }

  int dx = abs(toX - fromX);
  int dy = abs(toY - fromY);
  int error = -dx >> 1;
  int ystep = fromY < toY ? 1 : -1;
  int xstep = fromX < toX ? 1 : -1;
  int transitions = 0;
  bool inBlack = image_->get(steep ? fromY : fromX, steep ? fromX : fromY);
  for (int x = fromX, y = fromY; x != toX; x += xstep) {
    bool isBlack = image_->get(steep ? y : x, steep ? x : y);
    if (isBlack != inBlack) {
      transitions++;
      inBlack = isBlack;
    }
    error += dy;
    if (error > 0) {
      if (y == toY) {
        break;
      }
      y += ystep;
      error -= dx;
    }
  }
  Ref<ResultPointsAndTransitions> result(new ResultPointsAndTransitions(from, to, transitions));
  return result;
}

Ref<PerspectiveTransform> Detector::createTransform(Ref<ResultPoint> topLeft,
    Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft, Ref<ResultPoint> bottomRight,
    int dimensionX, int dimensionY) {

  Ref<PerspectiveTransform> transform(
      PerspectiveTransform::quadrilateralToQuadrilateral(
          0.5f,
          0.5f,
          dimensionX - 0.5f,
          0.5f,
          dimensionX - 0.5f,
          dimensionY - 0.5f,
          0.5f,
          dimensionY - 0.5f,
          topLeft->getX(),
          topLeft->getY(),
          topRight->getX(),
          topRight->getY(),
          bottomRight->getX(),
          bottomRight->getY(),
          bottomLeft->getX(),
          bottomLeft->getY()));
  return transform;
}

Ref<BitMatrix> Detector::sampleGrid(Ref<BitMatrix> image, int dimensionX, int dimensionY,
    Ref<PerspectiveTransform> transform) {
  GridSampler &sampler = GridSampler::getInstance();
  return sampler.sampleGrid(image, dimensionX, dimensionY, transform);
}

void Detector::insertionSort(std::vector<Ref<ResultPointsAndTransitions> > &vector) {
  int max = vector.size();
  bool swapped = true;
  Ref<ResultPointsAndTransitions> value;
  Ref<ResultPointsAndTransitions> valueB;
  do {
    swapped = false;
    for (int i = 1; i < max; i++) {
      value = vector[i - 1];
      if (compare(value, (valueB = vector[i])) > 0){
        swapped = true;
        vector[i - 1].reset(valueB);
        vector[i].reset(value);
      }
    }
  } while (swapped);
}

int Detector::compare(Ref<ResultPointsAndTransitions> a, Ref<ResultPointsAndTransitions> b) {
  return a->getTransitions() - b->getTransitions();
}
}
}

// file: zxing/datamatrix/detector/DetectorException.cpp

/*
 * DetectorException.cpp
 *
 *  Created on: Aug 26, 2011
 *      Author: luiz
 */

// #include "DetectorException.h"

namespace zxing {
namespace datamatrix {

DetectorException::DetectorException(const char *msg) :
    Exception(msg) {

}

DetectorException::~DetectorException() throw () {
  // TODO Auto-generated destructor stub
}

}
} /* namespace zxing */

// file: zxing/datamatrix/detector/MonochromeRectangleDetector.cpp

/*
 *  MonochromeRectangleDetector.cpp
 *  zxing
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/ReaderException.h>
// #include <zxing/datamatrix/detector/MonochromeRectangleDetector.h>
// #include <sstream>

namespace zxing {
namespace datamatrix {

std::vector<Ref<CornerPoint> > MonochromeRectangleDetector::detect() {
    int height = image_->getHeight();
    int width = image_->getWidth();
    int halfHeight = height >> 1;
    int halfWidth = width >> 1;
    int deltaY = max(1, height / (MAX_MODULES << 3));
    int deltaX = max(1, width / (MAX_MODULES << 3));

    int top = 0;
    int bottom = height;
    int left = 0;
    int right = width;
    Ref<CornerPoint> pointA(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, -deltaY, top, bottom, halfWidth >> 1));
    top = (int) pointA->getY() - 1;
    Ref<CornerPoint> pointB(findCornerFromCenter(halfWidth, -deltaX, left, right,
        halfHeight, 0, top, bottom, halfHeight >> 1));
    left = (int) pointB->getX() - 1;
    Ref<CornerPoint> pointC(findCornerFromCenter(halfWidth, deltaX, left, right,
        halfHeight, 0, top, bottom, halfHeight >> 1));
    right = (int) pointC->getX() + 1;
    Ref<CornerPoint> pointD(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, deltaY, top, bottom, halfWidth >> 1));
    bottom = (int) pointD->getY() + 1;

    // Go try to find point A again with better information -- might have been off at first.
    pointA.reset(findCornerFromCenter(halfWidth, 0, left, right,
        halfHeight, -deltaY, top, bottom, halfWidth >> 2));
	  std::vector<Ref<CornerPoint> > corners(4);

  	corners[0].reset(pointA);
  	corners[1].reset(pointB);
  	corners[2].reset(pointC);
  	corners[3].reset(pointD);
    return corners;
  }

Ref<CornerPoint> MonochromeRectangleDetector::findCornerFromCenter(int centerX, int deltaX, int left, int right,
      int centerY, int deltaY, int top, int bottom, int maxWhiteRun) {
	Ref<TwoInts> lastRange(NULL);
    for (int y = centerY, x = centerX;
         y < bottom && y >= top && x < right && x >= left;
         y += deltaY, x += deltaX) {
    Ref<TwoInts> range(NULL);
      if (deltaX == 0) {
        // horizontal slices, up and down
        range = blackWhiteRange(y, maxWhiteRun, left, right, true);
      } else {
        // vertical slices, left and right
        range = blackWhiteRange(x, maxWhiteRun, top, bottom, false);
      }
      if (range == NULL) {
        if (lastRange == NULL) {
			    throw ReaderException("Couldn't find corners (lastRange = NULL) ");
        } else {
        // lastRange was found
        if (deltaX == 0) {
          int lastY = y - deltaY;
          if (lastRange->start < centerX) {
            if (lastRange->end > centerX) {
              // straddle, choose one or the other based on direction
			        Ref<CornerPoint> result(new CornerPoint(deltaY > 0 ? lastRange->start : lastRange->end, lastY));
			        return result;
            }
			      Ref<CornerPoint> result(new CornerPoint(lastRange->start, lastY));
			      return result;
          } else {
			      Ref<CornerPoint> result(new CornerPoint(lastRange->end, lastY));
			      return result;
            }
        } else {
          int lastX = x - deltaX;
          if (lastRange->start < centerY) {
            if (lastRange->end > centerY) {
			        Ref<CornerPoint> result(new CornerPoint(lastX, deltaX < 0 ? lastRange->start : lastRange->end));
			        return result;
            }
			      Ref<CornerPoint> result(new CornerPoint(lastX, lastRange->start));
			      return result;
          } else {
			      Ref<CornerPoint> result(new CornerPoint(lastX, lastRange->end));
			      return result;
            }
          }
        }
      }
      lastRange = range;
    }
    throw ReaderException("Couldn't find corners");
  }

Ref<TwoInts> MonochromeRectangleDetector::blackWhiteRange(int fixedDimension, int maxWhiteRun, int minDim, int maxDim,
      bool horizontal) {

	  int center = (minDim + maxDim) >> 1;

    // Scan left/up first
    int start = center;
    while (start >= minDim) {
      if (horizontal ? image_->get(start, fixedDimension) : image_->get(fixedDimension, start)) {
        start--;
      } else {
        int whiteRunStart = start;
        do {
          start--;
        } while (start >= minDim && !(horizontal ? image_->get(start, fixedDimension) :
            image_->get(fixedDimension, start)));
        int whiteRunSize = whiteRunStart - start;
        if (start < minDim || whiteRunSize > maxWhiteRun) {
          start = whiteRunStart;
          break;
        }
      }
    }
    start++;

    // Then try right/down
    int end = center;
    while (end < maxDim) {
      if (horizontal ? image_->get(end, fixedDimension) : image_->get(fixedDimension, end)) {
        end++;
      } else {
        int whiteRunStart = end;
        do {
          end++;
        } while (end < maxDim && !(horizontal ? image_->get(end, fixedDimension) :
            image_->get(fixedDimension, end)));
        int whiteRunSize = end - whiteRunStart;
        if (end >= maxDim || whiteRunSize > maxWhiteRun) {
          end = whiteRunStart;
          break;
        }
      }
    }
    end--;
    Ref<TwoInts> result(NULL);
    if (end > start) {
		result = new TwoInts;
      result->start = start;
      result->end = end;
    }
    return result;
  }
}
}

// file: zxing/multi/ByQuadrantReader.cpp

/*
 *  Copyright 2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/multi/ByQuadrantReader.h>
// #include <zxing/ReaderException.h>

namespace zxing {
namespace multi {

ByQuadrantReader::ByQuadrantReader(Reader& delegate) : delegate_(delegate) {}

ByQuadrantReader::~ByQuadrantReader(){}

Ref<Result> ByQuadrantReader::decode(Ref<BinaryBitmap> image){
  return decode(image, DecodeHints::DEFAULT_HINT);
}

Ref<Result> ByQuadrantReader::decode(Ref<BinaryBitmap> image, DecodeHints hints){
  int width = image->getWidth();
  int height = image->getHeight();
  int halfWidth = width / 2;
  int halfHeight = height / 2;
  Ref<BinaryBitmap> topLeft = image->crop(0, 0, halfWidth, halfHeight);
  try {
    return delegate_.decode(topLeft, hints);
  } catch (ReaderException re) {
    // continue
  }

  Ref<BinaryBitmap> topRight = image->crop(halfWidth, 0, halfWidth, halfHeight);
  try {
    return delegate_.decode(topRight, hints);
  } catch (ReaderException re) {
    // continue
  }

  Ref<BinaryBitmap> bottomLeft = image->crop(0, halfHeight, halfWidth, halfHeight);
  try {
    return delegate_.decode(bottomLeft, hints);
  } catch (ReaderException re) {
    // continue
  }

  Ref<BinaryBitmap> bottomRight = image->crop(halfWidth, halfHeight, halfWidth, halfHeight);
  try {
    return delegate_.decode(bottomRight, hints);
  } catch (ReaderException re) {
    // continue
  }

  int quarterWidth = halfWidth / 2;
  int quarterHeight = halfHeight / 2;
  Ref<BinaryBitmap> center = image->crop(quarterWidth, quarterHeight, halfWidth, halfHeight);
  return delegate_.decode(center, hints);
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/multi/GenericMultipleBarcodeReader.cpp

/*
 *  Copyright 2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/multi/GenericMultipleBarcodeReader.h>
// #include <zxing/ReaderException.h>
// #include <zxing/ResultPoint.h>

namespace zxing {
namespace multi {
GenericMultipleBarcodeReader::GenericMultipleBarcodeReader(Reader& delegate) :
  delegate_(delegate)
{
}

GenericMultipleBarcodeReader::~GenericMultipleBarcodeReader(){}

std::vector<Ref<Result> > GenericMultipleBarcodeReader::decodeMultiple(
  Ref<BinaryBitmap> image, DecodeHints hints)
{
  std::vector<Ref<Result> > results;
  doDecodeMultiple(image, hints, results, 0, 0);
  if (results.empty()){
    throw ReaderException("No code detected");
  }
  return results;
}

void GenericMultipleBarcodeReader::doDecodeMultiple(Ref<BinaryBitmap> image,
  DecodeHints hints, std::vector<Ref<Result> >& results, int xOffset, int yOffset)
{
  Ref<Result> result;
  try {
    result = delegate_.decode(image, hints);
  } catch (ReaderException re) {
    return;
  }
  bool alreadyFound = false;
  for (unsigned int i = 0; i < results.size(); i++) {
    Ref<Result> existingResult = results[i];
    if (existingResult->getText()->getText() == result->getText()->getText()) {
      alreadyFound = true;
      break;
    }
  }
  if (alreadyFound) {
    return;
  }

  results.push_back(translateResultPoints(result, xOffset, yOffset));
  const std::vector<Ref<ResultPoint> > resultPoints = result->getResultPoints();
  if (resultPoints.empty()) {
    return;
  }

  int width = image->getWidth();
  int height = image->getHeight();
  float minX = width;
  float minY = height;
  float maxX = 0.0f;
  float maxY = 0.0f;
  for (unsigned int i = 0; i < resultPoints.size(); i++) {
    Ref<ResultPoint> point = resultPoints[i];
    float x = point->getX();
    float y = point->getY();
    if (x < minX) {
      minX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  }

  // Decode left of barcode
  if (minX > MIN_DIMENSION_TO_RECUR) {
    doDecodeMultiple(image->crop(0, 0, (int) minX, height),
                     hints, results, xOffset, yOffset);
  }
  // Decode above barcode
  if (minY > MIN_DIMENSION_TO_RECUR) {
    doDecodeMultiple(image->crop(0, 0, width, (int) minY),
                     hints, results, xOffset, yOffset);
  }
  // Decode right of barcode
  if (maxX < width - MIN_DIMENSION_TO_RECUR) {
    doDecodeMultiple(image->crop((int) maxX, 0, width - (int) maxX, height),
                     hints, results, xOffset + (int) maxX, yOffset);
  }
  // Decode below barcode
  if (maxY < height - MIN_DIMENSION_TO_RECUR) {
    doDecodeMultiple(image->crop(0, (int) maxY, width, height - (int) maxY),
                     hints, results, xOffset, yOffset + (int) maxY);
  }
}

Ref<Result> GenericMultipleBarcodeReader::translateResultPoints(Ref<Result> result, int xOffset, int yOffset){
  const std::vector<Ref<ResultPoint> > oldResultPoints = result->getResultPoints();
  if (oldResultPoints.empty()) {
    return result;
  }
  std::vector<Ref<ResultPoint> > newResultPoints;
  for (unsigned int i = 0; i < oldResultPoints.size(); i++) {
    Ref<ResultPoint> oldPoint = oldResultPoints[i];
    newResultPoints.push_back(Ref<ResultPoint>(new ResultPoint(oldPoint->getX() + xOffset, oldPoint->getY() + yOffset)));
  }
  return Ref<Result>(new Result(result->getText(), result->getRawBytes(), newResultPoints, result->getBarcodeFormat()));
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/multi/MultipleBarcodeReader.cpp

/*
 *  Copyright 2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/multi/MultipleBarcodeReader.h>

namespace zxing {
namespace multi {

MultipleBarcodeReader::~MultipleBarcodeReader() { }

std::vector<Ref<Result> > MultipleBarcodeReader::decodeMultiple(Ref<BinaryBitmap> image) {
  return decodeMultiple(image, DecodeHints::DEFAULT_HINT);
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/multi/qrcode/QRCodeMultiReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/multi/qrcode/QRCodeMultiReader.h>
// #include <zxing/ReaderException.h>
// #include <zxing/multi/qrcode/detector/MultiDetector.h>
// #include <zxing/BarcodeFormat.h>

namespace zxing {
namespace multi {
QRCodeMultiReader::QRCodeMultiReader(){}

QRCodeMultiReader::~QRCodeMultiReader(){}

std::vector<Ref<Result> > QRCodeMultiReader::decodeMultiple(Ref<BinaryBitmap> image,
  DecodeHints hints)
{
  std::vector<Ref<Result> > results;
  MultiDetector detector(image->getBlackMatrix());

  std::vector<Ref<DetectorResult> > detectorResult =  detector.detectMulti(hints);
  for (unsigned int i = 0; i < detectorResult.size(); i++) {
    try {
      Ref<DecoderResult> decoderResult = getDecoder().decode(detectorResult[i]->getBits());
      std::vector<Ref<ResultPoint> > points = detectorResult[i]->getPoints();
      Ref<Result> result = Ref<Result>(new Result(decoderResult->getText(),
      decoderResult->getRawBytes(),
      points, BarcodeFormat_QR_CODE));
      // result->putMetadata(ResultMetadataType.BYTE_SEGMENTS, decoderResult->getByteSegments());
      // result->putMetadata(ResultMetadataType.ERROR_CORRECTION_LEVEL, decoderResult->getECLevel().toString());
      results.push_back(result);
    } catch (ReaderException re) {
    // ignore and continue
    }
  }
  if (results.empty()){
    throw ReaderException("No code detected");
  }
  return results;
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/multi/qrcode/detector/MultiDetector.cpp

/*
 *  Copyright 2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/multi/qrcode/detector/MultiDetector.h>
// #include <zxing/multi/qrcode/detector/MultiFinderPatternFinder.h>
// #include <zxing/ReaderException.h>

namespace zxing {
namespace multi {
using namespace zxing::qrcode;

MultiDetector::MultiDetector(Ref<BitMatrix> image) : Detector(image) {}

MultiDetector::~MultiDetector(){}

std::vector<Ref<DetectorResult> > MultiDetector::detectMulti(DecodeHints hints){
  Ref<BitMatrix> image = getImage();
  MultiFinderPatternFinder finder = MultiFinderPatternFinder(image, hints.getResultPointCallback());
  std::vector<Ref<FinderPatternInfo> > info = finder.findMulti(hints);
  std::vector<Ref<DetectorResult> > result;
  for(unsigned int i = 0; i < info.size(); i++){
    try{
      result.push_back(processFinderPatternInfo(info[i]));
    } catch (ReaderException e){
      // ignore
    }
  }

  return result;
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/multi/qrcode/detector/MultiFinderPatternFinder.cpp

/*
 *  Copyright 2011 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <algorithm>
// #include <math.h>
// #include <stdlib.h>
// #include <zxing/multi/qrcode/detector/MultiFinderPatternFinder.h>
// #include <zxing/DecodeHints.h>
// #include <zxing/ReaderException.h>

namespace zxing{
namespace multi {
using namespace zxing::qrcode;

const float MultiFinderPatternFinder::MAX_MODULE_COUNT_PER_EDGE = 180;
const float MultiFinderPatternFinder::MIN_MODULE_COUNT_PER_EDGE = 9;
const float MultiFinderPatternFinder::DIFF_MODSIZE_CUTOFF_PERCENT = 0.05f;
const float MultiFinderPatternFinder::DIFF_MODSIZE_CUTOFF = 0.5f;

bool compareModuleSize(Ref<FinderPattern> a, Ref<FinderPattern> b){
    float value = a->getEstimatedModuleSize() - b->getEstimatedModuleSize();
    return value < 0.0;
}


MultiFinderPatternFinder::MultiFinderPatternFinder(Ref<BitMatrix> image,
  Ref<ResultPointCallback> resultPointCallback) :
    FinderPatternFinder(image, resultPointCallback)
{
}

MultiFinderPatternFinder::~MultiFinderPatternFinder(){}

std::vector<Ref<FinderPatternInfo> > MultiFinderPatternFinder::findMulti(DecodeHints const& hints){
  bool tryHarder = hints.getTryHarder();
  Ref<BitMatrix> image = image_; // Protected member
  int maxI = image->getHeight();
  int maxJ = image->getWidth();
  // We are looking for black/white/black/white/black modules in
  // 1:1:3:1:1 ratio; this tracks the number of such modules seen so far

  // Let's assume that the maximum version QR Code we support takes up 1/4 the height of the
  // image, and then account for the center being 3 modules in size. This gives the smallest
  // number of pixels the center could be, so skip this often. When trying harder, look for all
  // QR versions regardless of how dense they are.
  int iSkip = (int) (maxI / (MAX_MODULES * 4.0f) * 3);
  if (iSkip < MIN_SKIP || tryHarder) {
    iSkip = MIN_SKIP;
  }

  int stateCount[5];
  for (int i = iSkip - 1; i < maxI; i += iSkip) {
    // Get a row of black/white values
    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;
    stateCount[3] = 0;
    stateCount[4] = 0;
    int currentState = 0;
    for (int j = 0; j < maxJ; j++) {
      if (image->get(j, i)) {
        // Black pixel
        if ((currentState & 1) == 1) { // Counting white pixels
          currentState++;
        }
        stateCount[currentState]++;
      } else { // White pixel
        if ((currentState & 1) == 0) { // Counting black pixels
          if (currentState == 4) { // A winner?
            if (foundPatternCross(stateCount)) { // Yes
              bool confirmed = handlePossibleCenter(stateCount, i, j);
              if (!confirmed) {
                do { // Advance to next black pixel
                  j++;
                } while (j < maxJ && !image->get(j, i));
                  j--; // back up to that last white pixel
              }
              // Clear state to start looking again
              currentState = 0;
              stateCount[0] = 0;
              stateCount[1] = 0;
              stateCount[2] = 0;
              stateCount[3] = 0;
              stateCount[4] = 0;
            } else { // No, shift counts back by two
              stateCount[0] = stateCount[2];
              stateCount[1] = stateCount[3];
              stateCount[2] = stateCount[4];
              stateCount[3] = 1;
              stateCount[4] = 0;
              currentState = 3;
            }
          } else {
            stateCount[++currentState]++;
          }
        } else { // Counting white pixels
            stateCount[currentState]++;
        }
      }
    } // for j=...

    if (foundPatternCross(stateCount)) {
      handlePossibleCenter(stateCount, i, maxJ);
    } // end if foundPatternCross
  } // for i=iSkip-1 ...
  std::vector<std::vector<Ref<FinderPattern> > > patternInfo = selectBestPatterns();
  std::vector<Ref<FinderPatternInfo> > result;
  for (unsigned int i = 0; i < patternInfo.size(); i++) {
    std::vector<Ref<FinderPattern> > pattern = patternInfo[i];
    FinderPatternFinder::orderBestPatterns(pattern);
    result.push_back(Ref<FinderPatternInfo>(new FinderPatternInfo(pattern)));
  }
  return result;
}

std::vector<std::vector<Ref<FinderPattern> > > MultiFinderPatternFinder::selectBestPatterns(){
  std::vector<Ref<FinderPattern> > possibleCenters = possibleCenters_;

  int size = possibleCenters.size();

  if (size < 3) {
    // Couldn't find enough finder patterns
    throw ReaderException("No code detected");
  }

  std::vector<std::vector<Ref<FinderPattern> > > results;

  /*
  * Begin HE modifications to safely detect multiple codes of equal size
  */
  if (size == 3) {
    results.push_back(possibleCenters_);
    return results;
  }

  // Sort by estimated module size to speed up the upcoming checks
  //TODO do a sort based on module size
  std::sort(possibleCenters.begin(), possibleCenters.end(), compareModuleSize);

  /*
  * Now lets start: build a list of tuples of three finder locations that
  *  - feature similar module sizes
  *  - are placed in a distance so the estimated module count is within the QR specification
  *  - have similar distance between upper left/right and left top/bottom finder patterns
  *  - form a triangle with 90° angle (checked by comparing top right/bottom left distance
  *    with pythagoras)
  *
  * Note: we allow each point to be used for more than one code region: this might seem
  * counterintuitive at first, but the performance penalty is not that big. At this point,
  * we cannot make a good quality decision whether the three finders actually represent
  * a QR code, or are just by chance layouted so it looks like there might be a QR code there.
  * So, if the layout seems right, lets have the decoder try to decode.
  */

  for (int i1 = 0; i1 < (size - 2); i1++) {
    Ref<FinderPattern> p1 = possibleCenters[i1];
    for (int i2 = i1 + 1; i2 < (size - 1); i2++) {
      Ref<FinderPattern> p2 = possibleCenters[i2];
      // Compare the expected module sizes; if they are really off, skip
      float vModSize12 = (p1->getEstimatedModuleSize() - p2->getEstimatedModuleSize()) / std::min(p1->getEstimatedModuleSize(), p2->getEstimatedModuleSize());
      float vModSize12A = abs(p1->getEstimatedModuleSize() - p2->getEstimatedModuleSize());
      if (vModSize12A > DIFF_MODSIZE_CUTOFF && vModSize12 >= DIFF_MODSIZE_CUTOFF_PERCENT) {
        // break, since elements are ordered by the module size deviation there cannot be
        // any more interesting elements for the given p1.
        break;
      }
      for (int i3 = i2 + 1; i3 < size; i3++) {
        Ref<FinderPattern> p3 = possibleCenters[i3];
        // Compare the expected module sizes; if they are really off, skip
        float vModSize23 = (p2->getEstimatedModuleSize() - p3->getEstimatedModuleSize()) / std::min(p2->getEstimatedModuleSize(), p3->getEstimatedModuleSize());
        float vModSize23A = abs(p2->getEstimatedModuleSize() - p3->getEstimatedModuleSize());
        if (vModSize23A > DIFF_MODSIZE_CUTOFF && vModSize23 >= DIFF_MODSIZE_CUTOFF_PERCENT) {
          // break, since elements are ordered by the module size deviation there cannot be
          // any more interesting elements for the given p1.
          break;
        }
        std::vector<Ref<FinderPattern> > test;
        test.push_back(p1);
        test.push_back(p2);
        test.push_back(p3);
        FinderPatternFinder::orderBestPatterns(test);
        // Calculate the distances: a = topleft-bottomleft, b=topleft-topright, c = diagonal
        Ref<FinderPatternInfo> info = Ref<FinderPatternInfo>(new FinderPatternInfo(test));
        float dA = FinderPatternFinder::distance(info->getTopLeft(), info->getBottomLeft());
        float dC = FinderPatternFinder::distance(info->getTopRight(), info->getBottomLeft());
        float dB = FinderPatternFinder::distance(info->getTopLeft(), info->getTopRight());
        // Check the sizes
        float estimatedModuleCount = (dA + dB) / (p1->getEstimatedModuleSize() * 2.0f);
        if (estimatedModuleCount > MAX_MODULE_COUNT_PER_EDGE || estimatedModuleCount < MIN_MODULE_COUNT_PER_EDGE) {
          continue;
        }
        // Calculate the difference of the edge lengths in percent
        float vABBC = abs((dA - dB) / std::min(dA, dB));
        if (vABBC >= 0.1f) {
          continue;
        }
        // Calculate the diagonal length by assuming a 90° angle at topleft
        float dCpy = (float) sqrt(dA * dA + dB * dB);
        // Compare to the real distance in %
        float vPyC = abs((dC - dCpy) / std::min(dC, dCpy));
        if (vPyC >= 0.1f) {
          continue;
        }
        // All tests passed!
        results.push_back(test);
      } // end iterate p3
    } // end iterate p2
  } // end iterate p1
  if (results.empty()){
    // Nothing found!
    throw ReaderException("No code detected");
  }
  return results;
}

} // End zxing::multi namespace
} // End zxing namespace

// file: zxing/oned/Code128Reader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "Code128Reader.h"
// #include <zxing/oned/OneDResultPoint.h>
// #include <zxing/common/Array.h>
// #include <zxing/ReaderException.h>
// #include <math.h>
// #include <string.h>
// #include <sstream>

namespace zxing {
	namespace oned {

		const int CODE_PATTERNS_LENGTH = 107;
		const int countersLength = 6;
		static const int CODE_PATTERNS[CODE_PATTERNS_LENGTH][countersLength] = {
			{2, 1, 2, 2, 2, 2}, /* 0 */
			{2, 2, 2, 1, 2, 2},
			{2, 2, 2, 2, 2, 1},
			{1, 2, 1, 2, 2, 3},
			{1, 2, 1, 3, 2, 2},
			{1, 3, 1, 2, 2, 2}, /* 5 */
			{1, 2, 2, 2, 1, 3},
			{1, 2, 2, 3, 1, 2},
			{1, 3, 2, 2, 1, 2},
			{2, 2, 1, 2, 1, 3},
			{2, 2, 1, 3, 1, 2}, /* 10 */
			{2, 3, 1, 2, 1, 2},
			{1, 1, 2, 2, 3, 2},
			{1, 2, 2, 1, 3, 2},
			{1, 2, 2, 2, 3, 1},
			{1, 1, 3, 2, 2, 2}, /* 15 */
			{1, 2, 3, 1, 2, 2},
			{1, 2, 3, 2, 2, 1},
			{2, 2, 3, 2, 1, 1},
			{2, 2, 1, 1, 3, 2},
			{2, 2, 1, 2, 3, 1}, /* 20 */
			{2, 1, 3, 2, 1, 2},
			{2, 2, 3, 1, 1, 2},
			{3, 1, 2, 1, 3, 1},
			{3, 1, 1, 2, 2, 2},
			{3, 2, 1, 1, 2, 2}, /* 25 */
			{3, 2, 1, 2, 2, 1},
			{3, 1, 2, 2, 1, 2},
			{3, 2, 2, 1, 1, 2},
			{3, 2, 2, 2, 1, 1},
			{2, 1, 2, 1, 2, 3}, /* 30 */
			{2, 1, 2, 3, 2, 1},
			{2, 3, 2, 1, 2, 1},
			{1, 1, 1, 3, 2, 3},
			{1, 3, 1, 1, 2, 3},
			{1, 3, 1, 3, 2, 1}, /* 35 */
			{1, 1, 2, 3, 1, 3},
			{1, 3, 2, 1, 1, 3},
			{1, 3, 2, 3, 1, 1},
			{2, 1, 1, 3, 1, 3},
			{2, 3, 1, 1, 1, 3}, /* 40 */
			{2, 3, 1, 3, 1, 1},
			{1, 1, 2, 1, 3, 3},
			{1, 1, 2, 3, 3, 1},
			{1, 3, 2, 1, 3, 1},
			{1, 1, 3, 1, 2, 3}, /* 45 */
			{1, 1, 3, 3, 2, 1},
			{1, 3, 3, 1, 2, 1},
			{3, 1, 3, 1, 2, 1},
			{2, 1, 1, 3, 3, 1},
			{2, 3, 1, 1, 3, 1}, /* 50 */
			{2, 1, 3, 1, 1, 3},
			{2, 1, 3, 3, 1, 1},
			{2, 1, 3, 1, 3, 1},
			{3, 1, 1, 1, 2, 3},
			{3, 1, 1, 3, 2, 1}, /* 55 */
			{3, 3, 1, 1, 2, 1},
			{3, 1, 2, 1, 1, 3},
			{3, 1, 2, 3, 1, 1},
			{3, 3, 2, 1, 1, 1},
			{3, 1, 4, 1, 1, 1}, /* 60 */
			{2, 2, 1, 4, 1, 1},
			{4, 3, 1, 1, 1, 1},
			{1, 1, 1, 2, 2, 4},
			{1, 1, 1, 4, 2, 2},
			{1, 2, 1, 1, 2, 4}, /* 65 */
			{1, 2, 1, 4, 2, 1},
			{1, 4, 1, 1, 2, 2},
			{1, 4, 1, 2, 2, 1},
			{1, 1, 2, 2, 1, 4},
			{1, 1, 2, 4, 1, 2}, /* 70 */
			{1, 2, 2, 1, 1, 4},
			{1, 2, 2, 4, 1, 1},
			{1, 4, 2, 1, 1, 2},
			{1, 4, 2, 2, 1, 1},
			{2, 4, 1, 2, 1, 1}, /* 75 */
			{2, 2, 1, 1, 1, 4},
			{4, 1, 3, 1, 1, 1},
			{2, 4, 1, 1, 1, 2},
			{1, 3, 4, 1, 1, 1},
			{1, 1, 1, 2, 4, 2}, /* 80 */
			{1, 2, 1, 1, 4, 2},
			{1, 2, 1, 2, 4, 1},
			{1, 1, 4, 2, 1, 2},
			{1, 2, 4, 1, 1, 2},
			{1, 2, 4, 2, 1, 1}, /* 85 */
			{4, 1, 1, 2, 1, 2},
			{4, 2, 1, 1, 1, 2},
			{4, 2, 1, 2, 1, 1},
			{2, 1, 2, 1, 4, 1},
			{2, 1, 4, 1, 2, 1}, /* 90 */
			{4, 1, 2, 1, 2, 1},
			{1, 1, 1, 1, 4, 3},
			{1, 1, 1, 3, 4, 1},
			{1, 3, 1, 1, 4, 1},
			{1, 1, 4, 1, 1, 3}, /* 95 */
			{1, 1, 4, 3, 1, 1},
			{4, 1, 1, 1, 1, 3},
			{4, 1, 1, 3, 1, 1},
			{1, 1, 3, 1, 4, 1},
			{1, 1, 4, 1, 3, 1}, /* 100 */
			{3, 1, 1, 1, 4, 1},
			{4, 1, 1, 1, 3, 1},
			{2, 1, 1, 4, 1, 2},
			{2, 1, 1, 2, 1, 4},
			{2, 1, 1, 2, 3, 2}, /* 105 */
			{2, 3, 3, 1, 1, 1}
		};


		Code128Reader::Code128Reader(){
		}

		int* Code128Reader::findStartPattern(Ref<BitArray> row){
			int width = row->getSize();
			int rowOffset = 0;
			while (rowOffset < width) {
				if (row->get(rowOffset)) {
					break;
				}
				rowOffset++;
			}

			int counterPosition = 0;
			int counters[countersLength] = {0,0,0,0,0,0};
			int patternStart = rowOffset;
			bool isWhite = false;
			int patternLength =  sizeof(counters) / sizeof(int);

			for (int i = rowOffset; i < width; i++) {
				bool pixel = row->get(i);
				if (pixel ^ isWhite) {
					counters[counterPosition]++;
				} else {
					if (counterPosition == patternLength - 1) {
						unsigned int bestVariance = MAX_AVG_VARIANCE;
						int bestMatch = -1;
						for (int startCode = CODE_START_A; startCode <= CODE_START_C; startCode++) {
							unsigned int variance = patternMatchVariance(counters, sizeof(counters) / sizeof(int),
							    CODE_PATTERNS[startCode], MAX_INDIVIDUAL_VARIANCE);
							if (variance < bestVariance) {
								bestVariance = variance;
								bestMatch = startCode;
							}
						}
						if (bestMatch >= 0) {
							// Look for whitespace before start pattern, >= 50% of width of start pattern
              if (row->isRange(std::max(0, patternStart - (i - patternStart) / 2), patternStart,
							    false)) {
								int* resultValue = new int[3];
								resultValue[0] = patternStart;
								resultValue[1] = i;
								resultValue[2] = bestMatch;
								return resultValue;
							}
						}
						patternStart += counters[0] + counters[1];
						for (int y = 2; y < patternLength; y++) {
							counters[y - 2] = counters[y];
						}
						counters[patternLength - 2] = 0;
						counters[patternLength - 1] = 0;
						counterPosition--;
					} else {
						counterPosition++;
					}
					counters[counterPosition] = 1;
					isWhite = !isWhite;
				}
			}
			throw ReaderException("");
		}

		int Code128Reader::decodeCode(Ref<BitArray> row, int counters[], int countersCount,
		    int rowOffset) {
		  if (!recordPattern(row, rowOffset, counters, countersCount)) {
		    throw ReaderException("");
		  }
			unsigned int bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
			int bestMatch = -1;
			for (int d = 0; d < CODE_PATTERNS_LENGTH; d++) {
				int pattern[countersLength];

				for(int ind = 0; ind< countersLength; ind++){
					pattern[ind] = CODE_PATTERNS[d][ind];
				}
//				memcpy(pattern, CODE_PATTERNS[d], countersLength);
				unsigned int variance = patternMatchVariance(counters, countersCount, pattern,
				    MAX_INDIVIDUAL_VARIANCE);
				if (variance < bestVariance) {
					bestVariance = variance;
					bestMatch = d;
				}
			}
			// TODO We're overlooking the fact that the STOP pattern has 7 values, not 6.
			if (bestMatch >= 0) {
				return bestMatch;
			} else {
				throw ReaderException("");
			}
		}

		Ref<Result> Code128Reader::decodeRow(int rowNumber, Ref<BitArray> row) {
		  int* startPatternInfo = NULL;
		  try {
        startPatternInfo = findStartPattern(row);
        int startCode = startPatternInfo[2];
        int codeSet;
        switch (startCode) {
          case CODE_START_A:
            codeSet = CODE_CODE_A;
            break;
          case CODE_START_B:
            codeSet = CODE_CODE_B;
            break;
          case CODE_START_C:
            codeSet = CODE_CODE_C;
            break;
          default:
            throw ReaderException("");
        }

        bool done = false;
        bool isNextShifted = false;

        std::string tmpResultString;
        std::stringstream tmpResultSStr; // used if its Code 128C

        int lastStart = startPatternInfo[0];
        int nextStart = startPatternInfo[1];
        int counters[countersLength] = {0,0,0,0,0,0};

        int lastCode = 0;
        int code = 0;
        int checksumTotal = startCode;
        int multiplier = 0;
        bool lastCharacterWasPrintable = true;

        while (!done) {
          bool unshift = isNextShifted;
          isNextShifted = false;

          // Save off last code
          lastCode = code;

          // Decode another code from image
          try {
            code = decodeCode(row, counters, sizeof(counters)/sizeof(int), nextStart);
          } catch (ReaderException const& re) {
            throw re;
          }

          // Remember whether the last code was printable or not (excluding CODE_STOP)
          if (code != CODE_STOP) {
            lastCharacterWasPrintable = true;
          }

          // Add to checksum computation (if not CODE_STOP of course)
          if (code != CODE_STOP) {
            multiplier++;
            checksumTotal += multiplier * code;
          }

          // Advance to where the next code will to start
          lastStart = nextStart;
          int _countersLength = sizeof(counters) / sizeof(int);
          for (int i = 0; i < _countersLength; i++) {
            nextStart += counters[i];
          }

          // Take care of illegal start codes
          switch (code) {
            case CODE_START_A:
            case CODE_START_B:
            case CODE_START_C:
              throw ReaderException("");
          }

          switch (codeSet) {

            case CODE_CODE_A:
              if (code < 64) {
                tmpResultString.append(1, (char) (' ' + code));
              } else if (code < 96) {
                tmpResultString.append(1, (char) (code - 64));
              } else {
                // Don't let CODE_STOP, which always appears, affect whether whether we think the
                // last code was printable or not.
                if (code != CODE_STOP) {
                  lastCharacterWasPrintable = false;
                }
                switch (code) {
                  case CODE_FNC_1:
                  case CODE_FNC_2:
                  case CODE_FNC_3:
                  case CODE_FNC_4_A:
                    // do nothing?
                    break;
                  case CODE_SHIFT:
                    isNextShifted = true;
                    codeSet = CODE_CODE_B;
                    break;
                  case CODE_CODE_B:
                    codeSet = CODE_CODE_B;
                    break;
                  case CODE_CODE_C:
                    codeSet = CODE_CODE_C;
                    break;
                  case CODE_STOP:
                    done = true;
                    break;
                }
              }
              break;
            case CODE_CODE_B:
              if (code < 96) {
                tmpResultString.append(1, (char) (' ' + code));
              } else {
                if (code != CODE_STOP) {
                  lastCharacterWasPrintable = false;
                }
                switch (code) {
                  case CODE_FNC_1:
                  case CODE_FNC_2:
                  case CODE_FNC_3:
                  case CODE_FNC_4_B:
                    // do nothing?
                    break;
                  case CODE_SHIFT:
                    isNextShifted = true;
                    codeSet = CODE_CODE_C;
                    break;
                  case CODE_CODE_A:
                    codeSet = CODE_CODE_A;
                    break;
                  case CODE_CODE_C:
                    codeSet = CODE_CODE_C;
                    break;
                  case CODE_STOP:
                    done = true;
                    break;
                }
              }
              break;
            case CODE_CODE_C:
              tmpResultSStr.str(std::string());
              // the code read in this case is the number encoded directly
              if (code < 100) {
                if (code < 10) {
 					        tmpResultSStr << '0';
 				        }
                tmpResultSStr << code;
 				        tmpResultString.append(tmpResultSStr.str());
              } else {
                if (code != CODE_STOP) {
                  lastCharacterWasPrintable = false;
                }
                switch (code) {
                  case CODE_FNC_1:
                    // do nothing?
                    break;
                  case CODE_CODE_A:
                    codeSet = CODE_CODE_A;
                    break;
                  case CODE_CODE_B:
                    codeSet = CODE_CODE_B;
                    break;
                  case CODE_STOP:
                    done = true;
                    break;
                }
              }
              break;
          }

          // Unshift back to another code set if we were shifted
          if (unshift) {
            switch (codeSet) {
              case CODE_CODE_A:
                codeSet = CODE_CODE_C;
                break;
              case CODE_CODE_B:
                codeSet = CODE_CODE_A;
                break;
              case CODE_CODE_C:
                codeSet = CODE_CODE_B;
                break;
            }
          }

        }

        // Check for ample whitespace following pattern, but, to do this we first need to remember that
        // we fudged decoding CODE_STOP since it actually has 7 bars, not 6. There is a black bar left
        // to read off. Would be slightly better to properly read. Here we just skip it:
        int width = row->getSize();
        while (nextStart < width && row->get(nextStart)) {
          nextStart++;
        }
        if (!row->isRange(nextStart,
                          std::min(width, nextStart + (nextStart - lastStart) / 2),
                          false)) {
          throw ReaderException("");
        }

        // Pull out from sum the value of the penultimate check code
        checksumTotal -= multiplier * lastCode;
        // lastCode is the checksum then:
        if (checksumTotal % 103 != lastCode) {
          throw ReaderException("");
        }

        // Need to pull out the check digits from string
        int resultLength = tmpResultString.length();
        // Only bother if the result had at least one character, and if the checksum digit happened to
        // be a printable character. If it was just interpreted as a control code, nothing to remove.
        if (resultLength > 0 && lastCharacterWasPrintable) {
          if (codeSet == CODE_CODE_C) {
            tmpResultString.erase(resultLength - 2, resultLength);
          } else {
            tmpResultString.erase(resultLength - 1, resultLength);
          }
        }

        Ref<String> resultString(new String(tmpResultString));
        if (tmpResultString.length() == 0) {
          // Almost surely a false positive
          throw ReaderException("");
        }

        float left = (float) (startPatternInfo[1] + startPatternInfo[0]) / 2.0f;
        float right = (float) (nextStart + lastStart) / 2.0f;

        std::vector< Ref<ResultPoint> > resultPoints(2);
        Ref<OneDResultPoint> resultPoint1(new OneDResultPoint(left, (float) rowNumber));
        Ref<OneDResultPoint> resultPoint2(new OneDResultPoint(right, (float) rowNumber));
        resultPoints[0] = resultPoint1;
        resultPoints[1] = resultPoint2;

        delete [] startPatternInfo;
        ArrayRef<unsigned char> resultBytes(1);
        return Ref<Result>(new Result(resultString, resultBytes, resultPoints,
            BarcodeFormat_CODE_128));
			} catch (ReaderException const& re) {
			  delete [] startPatternInfo;
			  return Ref<Result>();
			}
		}

		void Code128Reader::append(char* s, char c){
			int len = strlen(s);
			s[len] = c;
			s[len + 1] = '\0';
		}

		Code128Reader::~Code128Reader(){
		}
	}
}

// file: zxing/oned/Code39Reader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "Code39Reader.h"
// #include <zxing/oned/OneDResultPoint.h>
// #include <zxing/common/Array.h>
// #include <zxing/ReaderException.h>
// #include <math.h>
// #include <limits.h>

namespace zxing {
namespace oned {

  static const char* ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *$/+%";


  /**
   * These represent the encodings of characters, as patterns of wide and narrow
   * bars.
   * The 9 least-significant bits of each int correspond to the pattern of wide
   * and narrow, with 1s representing "wide" and 0s representing narrow.
   */
  const int CHARACTER_ENCODINGS_LEN = 44;
  static int CHARACTER_ENCODINGS[CHARACTER_ENCODINGS_LEN] = {
    0x034, 0x121, 0x061, 0x160, 0x031, 0x130, 0x070, 0x025, 0x124, 0x064, // 0-9
    0x109, 0x049, 0x148, 0x019, 0x118, 0x058, 0x00D, 0x10C, 0x04C, 0x01C, // A-J
    0x103, 0x043, 0x142, 0x013, 0x112, 0x052, 0x007, 0x106, 0x046, 0x016, // K-T
    0x181, 0x0C1, 0x1C0, 0x091, 0x190, 0x0D0, 0x085, 0x184, 0x0C4, 0x094, // U-*
    0x0A8, 0x0A2, 0x08A, 0x02A // $-%
  };

  static int ASTERISK_ENCODING = 0x094;
  static const char* ALPHABET_STRING =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. *$/+%";


  /**
   * Creates a reader that assumes all encoded data is data, and does not treat
   * the final character as a check digit. It will not decoded "extended
   * Code 39" sequences.
   */
  Code39Reader::Code39Reader() : alphabet_string(ALPHABET_STRING),
                                 usingCheckDigit(false),
                                 extendedMode(false) {
  }

  /**
   * Creates a reader that can be configured to check the last character as a
   * check digit. It will not decoded "extended Code 39" sequences.
   *
   * @param usingCheckDigit if true, treat the last data character as a check
   * digit, not data, and verify that the checksum passes.
   */
  Code39Reader::Code39Reader(bool usingCheckDigit_) :
    alphabet_string(ALPHABET_STRING),
    usingCheckDigit(usingCheckDigit_),
    extendedMode(false) {
  }


  Code39Reader::Code39Reader(bool usingCheckDigit_, bool extendedMode_) :
    alphabet_string(ALPHABET_STRING),
    usingCheckDigit(usingCheckDigit_),
    extendedMode(extendedMode_) {
  }

  Ref<Result> Code39Reader::decodeRow(int rowNumber, Ref<BitArray> row) {
    int* start = NULL;
    try {
      start = findAsteriskPattern(row);
      int nextStart = start[1];
      int end = row->getSize();

      // Read off white space
      while (nextStart < end && !row->get(nextStart)) {
        nextStart++;
      }

      std::string tmpResultString;

      const int countersLen = 9;
      int counters[countersLen];
      for (int i = 0; i < countersLen; i++) {
        counters[i] = 0;
      }
      char decodedChar;
      int lastStart;
      do {
        if (!recordPattern(row, nextStart, counters, countersLen)) {
          throw ReaderException("");
        }
        int pattern = toNarrowWidePattern(counters, countersLen);
        if (pattern < 0) {
          throw ReaderException("pattern < 0");
        }
        decodedChar = patternToChar(pattern);
        tmpResultString.append(1, decodedChar);
        lastStart = nextStart;
        for (int i = 0; i < countersLen; i++) {
          nextStart += counters[i];
        }
        // Read off white space
        while (nextStart < end && !row->get(nextStart)) {
          nextStart++;
        }
      } while (decodedChar != '*');
      tmpResultString.erase(tmpResultString.length()-1, 1);// remove asterisk

      // Look for whitespace after pattern:
      int lastPatternSize = 0;
      for (int i = 0; i < countersLen; i++) {
        lastPatternSize += counters[i];
      }
      int whiteSpaceAfterEnd = nextStart - lastStart - lastPatternSize;
      // If 50% of last pattern size, following last pattern, is not whitespace,
      // fail (but if it's whitespace to the very end of the image, that's OK)
      if (nextStart != end && whiteSpaceAfterEnd / 2 < lastPatternSize) {
        throw ReaderException("too short end white space");
      }

      if (usingCheckDigit) {
        int max = tmpResultString.length() - 1;
        unsigned int total = 0;
        for (int i = 0; i < max; i++) {
          total += alphabet_string.find_first_of(tmpResultString[i], 0);
        }
        if (total % 43 != alphabet_string.find_first_of(tmpResultString[max], 0)) {
          throw ReaderException("");
        }
        tmpResultString.erase(max, 1);
      }

      Ref<String> resultString(new String(tmpResultString));
      if (extendedMode) {
        resultString = decodeExtended(tmpResultString);
      }

      if (tmpResultString.length() == 0) {
        // Almost surely a false positive
        throw ReaderException("");
      }

      float left = (float) (start[1] + start[0]) / 2.0f;
      float right = (float) (nextStart + lastStart) / 2.0f;

      std::vector< Ref<ResultPoint> > resultPoints(2);
      Ref<OneDResultPoint> resultPoint1(
        new OneDResultPoint(left, (float) rowNumber));
      Ref<OneDResultPoint> resultPoint2(
        new OneDResultPoint(right, (float) rowNumber));
      resultPoints[0] = resultPoint1;
      resultPoints[1] = resultPoint2;

      ArrayRef<unsigned char> resultBytes(1);

      Ref<Result> res(new Result(
                        resultString, resultBytes, resultPoints, BarcodeFormat_CODE_39));

      delete [] start;
      return res;
    } catch (ReaderException const& re) {
      delete [] start;
      return Ref<Result>();
    }
  }

  int* Code39Reader::findAsteriskPattern(Ref<BitArray> row){
    int width = row->getSize();
    int rowOffset = 0;
    while (rowOffset < width) {
      if (row->get(rowOffset)) {
        break;
      }
      rowOffset++;
    }

    int counterPosition = 0;
    const int countersLen = 9;
    int counters[countersLen];
    for (int i = 0; i < countersLen; i++) {
      counters[i] = 0;
    }
    int patternStart = rowOffset;
    bool isWhite = false;
    int patternLength = countersLen;

    for (int i = rowOffset; i < width; i++) {
      bool pixel = row->get(i);
      if (pixel ^ isWhite) {
        counters[counterPosition]++;
      } else {
        if (counterPosition == patternLength - 1) {
          if (toNarrowWidePattern(counters, countersLen) == ASTERISK_ENCODING) {
            // Look for whitespace before start pattern, >= 50% of width of
            // start pattern.
            if (row->isRange(std::max(0, patternStart - ((i - patternStart) >> 1)), patternStart, false)) {
              int* resultValue = new int[2];
              resultValue[0] = patternStart;
              resultValue[1] = i;
              return resultValue;
            }
          }
          patternStart += counters[0] + counters[1];
          for (int y = 2; y < patternLength; y++) {
            counters[y - 2] = counters[y];
          }
          counters[patternLength - 2] = 0;
          counters[patternLength - 1] = 0;
          counterPosition--;
        } else {
          counterPosition++;
        }
        counters[counterPosition] = 1;
        isWhite = !isWhite;
      }
    }
    throw ReaderException("");
  }

  // For efficiency, returns -1 on failure. Not throwing here saved as many as
  // 700 exceptions per image when using some of our blackbox images.
  int Code39Reader::toNarrowWidePattern(int counters[], int countersLen){
    int numCounters = countersLen;
    int maxNarrowCounter = 0;
    int wideCounters;
    do {
      int minCounter = INT_MAX;
      for (int i = 0; i < numCounters; i++) {
        int counter = counters[i];
        if (counter < minCounter && counter > maxNarrowCounter) {
          minCounter = counter;
        }
      }
      maxNarrowCounter = minCounter;
      wideCounters = 0;
      int totalWideCountersWidth = 0;
      int pattern = 0;
      for (int i = 0; i < numCounters; i++) {
        int counter = counters[i];
        if (counters[i] > maxNarrowCounter) {
          pattern |= 1 << (numCounters - 1 - i);
          wideCounters++;
          totalWideCountersWidth += counter;
        }
      }
      if (wideCounters == 3) {
        // Found 3 wide counters, but are they close enough in width?
        // We can perform a cheap, conservative check to see if any individual
        // counter is more than 1.5 times the average:
        for (int i = 0; i < numCounters && wideCounters > 0; i++) {
          int counter = counters[i];
          if (counters[i] > maxNarrowCounter) {
            wideCounters--;
            // totalWideCountersWidth = 3 * average, so this checks if
            // counter >= 3/2 * average.
            if ((counter << 1) >= totalWideCountersWidth) {
              return -1;
            }
          }
        }
        return pattern;
      }
    } while (wideCounters > 3);
    return -1;
  }

  char Code39Reader::patternToChar(int pattern){
    for (int i = 0; i < CHARACTER_ENCODINGS_LEN; i++) {
      if (CHARACTER_ENCODINGS[i] == pattern) {
        return ALPHABET[i];
      }
    }
    throw ReaderException("");
  }

  Ref<String> Code39Reader::decodeExtended(std::string encoded){
    int length = encoded.length();
    std::string tmpDecoded;
    for (int i = 0; i < length; i++) {
      char c = encoded[i];
      if (c == '+' || c == '$' || c == '%' || c == '/') {
        char next = encoded[i + 1];
        char decodedChar = '\0';
        switch (c) {
          case '+':
            // +A to +Z map to a to z
            if (next >= 'A' && next <= 'Z') {
              decodedChar = (char) (next + 32);
            } else {
              throw ReaderException("");
            }
            break;
          case '$':
            // $A to $Z map to control codes SH to SB
            if (next >= 'A' && next <= 'Z') {
              decodedChar = (char) (next - 64);
            } else {
              throw ReaderException("");
            }
            break;
          case '%':
            // %A to %E map to control codes ESC to US
            if (next >= 'A' && next <= 'E') {
              decodedChar = (char) (next - 38);
            } else if (next >= 'F' && next <= 'W') {
              decodedChar = (char) (next - 11);
            } else {
              throw ReaderException("");
            }
            break;
          case '/':
            // /A to /O map to ! to , and /Z maps to :
            if (next >= 'A' && next <= 'O') {
              decodedChar = (char) (next - 32);
            } else if (next == 'Z') {
              decodedChar = ':';
            } else {
              throw ReaderException("");
            }
            break;
        }
        tmpDecoded.append(1, decodedChar);
        // bump up i again since we read two characters
        i++;
      } else {
        tmpDecoded.append(1, c);
      }
    }
    Ref<String> decoded(new String(tmpDecoded));
    return decoded;
  }
} // namespace oned
} // namespace zxing


// file: zxing/oned/EAN13Reader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "EAN13Reader.h"
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {

    static const int FIRST_DIGIT_ENCODINGS[10] = {
      0x00, 0x0B, 0x0D, 0xE, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A
    };

    EAN13Reader::EAN13Reader() { }

    int EAN13Reader::decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
        std::string& resultString) {
      (void)startGuardBegin;
      const int countersLen = 4;
      int counters[countersLen] = { 0, 0, 0, 0 };

      int end = row->getSize();
      int rowOffset = startGuardEnd;
      int lgPatternFound = 0;

      for (int x = 0; x < 6 && rowOffset < end; x++) {
        int bestMatch = decodeDigit(row, counters, countersLen, rowOffset,
            UPC_EAN_PATTERNS_L_AND_G_PATTERNS);
        if (bestMatch < 0) {
          return -1;
        }
        resultString.append(1, (char) ('0' + bestMatch % 10));
        for (int i = 0; i < countersLen; i++) {
          rowOffset += counters[i];
        }
        if (bestMatch >= 10) {
          lgPatternFound |= 1 << (5 - x);
        }
      }

      if (!determineFirstDigit(resultString, lgPatternFound)) {
        return -1;
      }

      int middleRangeStart;
      int middleRangeEnd;
      if (findGuardPattern(row, rowOffset, true, (int*)getMIDDLE_PATTERN(),
            getMIDDLE_PATTERN_LEN(), &middleRangeStart, &middleRangeEnd)) {
        rowOffset = middleRangeEnd;
        for (int x = 0; x < 6 && rowOffset < end; x++) {
          int bestMatch = decodeDigit(row, counters, countersLen, rowOffset,
              UPC_EAN_PATTERNS_L_PATTERNS);
          if (bestMatch < 0) {
            return -1;
          }
          resultString.append(1, (char) ('0' + bestMatch));
          for (int i = 0; i < countersLen; i++) {
            rowOffset += counters[i];
          }
        }
        return rowOffset;
      }
      return -1;
    }

    bool EAN13Reader::determineFirstDigit(std::string& resultString, int lgPatternFound) {
      for (int d = 0; d < 10; d++) {
        if (lgPatternFound == FIRST_DIGIT_ENCODINGS[d]) {
          resultString.insert(0, 1, (char) ('0' + d));
          return true;
        }
      }
      return false;
    }

    BarcodeFormat EAN13Reader::getBarcodeFormat(){
      return BarcodeFormat_EAN_13;
    }
  }
}

// file: zxing/oned/EAN8Reader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "EAN8Reader.h"
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {

    EAN8Reader::EAN8Reader(){ }

    int EAN8Reader::decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
        std::string& resultString){
      (void)startGuardBegin;
      const int countersLen = 4;
      int counters[countersLen] = { 0, 0, 0, 0 };

      int end = row->getSize();
      int rowOffset = startGuardEnd;

      for (int x = 0; x < 4 && rowOffset < end; x++) {
        int bestMatch = decodeDigit(row, counters, countersLen, rowOffset,
            UPC_EAN_PATTERNS_L_PATTERNS);
        if (bestMatch < 0) {
          return -1;
        }
        resultString.append(1, (char) ('0' + bestMatch));
        for (int i = 0; i < countersLen; i++) {
          rowOffset += counters[i];
        }
      }

      int middleRangeStart;
      int middleRangeEnd;
      if (findGuardPattern(row, rowOffset, true, (int*)getMIDDLE_PATTERN(),
            getMIDDLE_PATTERN_LEN(), &middleRangeStart, &middleRangeEnd)) {
        rowOffset = middleRangeEnd;
        for (int x = 0; x < 4 && rowOffset < end; x++) {
          int bestMatch = decodeDigit(row, counters, countersLen, rowOffset,
              UPC_EAN_PATTERNS_L_PATTERNS);
          if (bestMatch < 0) {
            return -1;
          }
          resultString.append(1, (char) ('0' + bestMatch));
          for (int i = 0; i < countersLen; i++) {
            rowOffset += counters[i];
          }
        }
        return rowOffset;
      }
      return -1;
    }

    BarcodeFormat EAN8Reader::getBarcodeFormat(){
      return BarcodeFormat_EAN_8;
    }
  }
}

// file: zxing/oned/ITFReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "ITFReader.h"
// #include <zxing/oned/OneDResultPoint.h>
// #include <zxing/common/Array.h>
// #include <zxing/ReaderException.h>
// #include <math.h>

namespace zxing {
  namespace oned {

    static const int W = 3; // Pixel width of a wide line
    static const int N = 1; // Pixed width of a narrow line

    const int DEFAULT_ALLOWED_LENGTHS_LEN = 10;
    const int DEFAULT_ALLOWED_LENGTHS[DEFAULT_ALLOWED_LENGTHS_LEN] = { 44, 24, 20, 18, 16, 14, 12, 10, 8, 6 };

    /**
     * Start/end guard pattern.
     *
     * Note: The end pattern is reversed because the row is reversed before
     * searching for the END_PATTERN
     */
    static const int START_PATTERN_LEN = 4;
    static const int START_PATTERN[START_PATTERN_LEN] = {N, N, N, N};

    static const int END_PATTERN_REVERSED_LEN = 3;
    static const int END_PATTERN_REVERSED[END_PATTERN_REVERSED_LEN] = {N, N, W};

    /**
     * Patterns of Wide / Narrow lines to indicate each digit
     */
    static const int PATTERNS_LEN = 10;
    static const int PATTERNS[PATTERNS_LEN][5] = {
      {N, N, W, W, N}, // 0
      {W, N, N, N, W}, // 1
      {N, W, N, N, W}, // 2
      {W, W, N, N, N}, // 3
      {N, N, W, N, W}, // 4
      {W, N, W, N, N}, // 5
      {N, W, W, N, N}, // 6
      {N, N, N, W, W}, // 7
      {W, N, N, W, N}, // 8
      {N, W, N, W, N}  // 9
    };


    ITFReader::ITFReader() : narrowLineWidth(-1) {
    }


    Ref<Result> ITFReader::decodeRow(int rowNumber, Ref<BitArray> row) {
      int* startRange = 0;
      int* endRange = 0;
      try {
        // Find out where the Middle section (payload) starts & ends
        startRange = decodeStart(row);
        endRange = decodeEnd(row);

        std::string tmpResult;
        decodeMiddle(row, startRange[1], endRange[0], tmpResult);

        // To avoid false positives with 2D barcodes (and other patterns), make
        // an assumption that the decoded string must be a known length
        int length = tmpResult.length();
        bool lengthOK = false;
        for (int i = 0; i < DEFAULT_ALLOWED_LENGTHS_LEN; i++) {
          if (length == DEFAULT_ALLOWED_LENGTHS[i]) {
            lengthOK = true;
            break;
          }
        }
        if (!lengthOK) {
          throw ReaderException("not enough characters count");
        }

        Ref<String> resultString(new String(tmpResult));

        std::vector< Ref<ResultPoint> > resultPoints(2);
        Ref<OneDResultPoint> resultPoint1(new OneDResultPoint(startRange[1], (float) rowNumber));
        Ref<OneDResultPoint> resultPoint2(new OneDResultPoint(endRange[0], (float) rowNumber));
        resultPoints[0] = resultPoint1;
        resultPoints[1] = resultPoint2;

        delete [] startRange;
        delete [] endRange;
        ArrayRef<unsigned char> resultBytes(1);
        return Ref<Result>(new Result(resultString, resultBytes, resultPoints, BarcodeFormat_ITF));
      } catch (ReaderException const& re) {
        delete [] startRange;
        delete [] endRange;
        return Ref<Result>();
      }
    }

    /**
     * @param row          row of black/white values to search
     * @param payloadStart offset of start pattern
     * @param resultString {@link StringBuffer} to append decoded chars to
     * @throws ReaderException if decoding could not complete successfully
     */
    void ITFReader::decodeMiddle(Ref<BitArray> row, int payloadStart, int payloadEnd,
        std::string& resultString) {
      // Digits are interleaved in pairs - 5 black lines for one digit, and the
      // 5
      // interleaved white lines for the second digit.
      // Therefore, need to scan 10 lines and then
      // split these into two arrays
      int counterDigitPairLen = 10;
      int counterDigitPair[counterDigitPairLen];
      for (int i=0; i<counterDigitPairLen; i++) {
        counterDigitPair[i] = 0;
      }

      int counterBlack[5];
      int counterWhite[5];
      for (int i=0; i<5; i++) {
        counterBlack[i] = 0;
        counterWhite[i] = 0;
      }

      while (payloadStart < payloadEnd) {
        // Get 10 runs of black/white.
        if (!recordPattern(row, payloadStart, counterDigitPair, counterDigitPairLen)) {
          throw ReaderException("");
        }
        // Split them into each array
        for (int k = 0; k < 5; k++) {
          int twoK = k << 1;
          counterBlack[k] = counterDigitPair[twoK];
          counterWhite[k] = counterDigitPair[twoK + 1];
        }

        int bestMatch = decodeDigit(counterBlack, 5);
        resultString.append(1, (char) ('0' + bestMatch));
        bestMatch = decodeDigit(counterWhite, 5);
        resultString.append(1, (char) ('0' + bestMatch));

        for (int i = 0; i < counterDigitPairLen; i++) {
          payloadStart += counterDigitPair[i];
        }
      }
    }

    /**
     * Identify where the start of the middle / payload section starts.
     *
     * @param row row of black/white values to search
     * @return Array, containing index of start of 'start block' and end of
     *         'start block'
     * @throws ReaderException
     */
    int* ITFReader::decodeStart(Ref<BitArray> row) {
      int endStart = skipWhiteSpace(row);
      int* startPattern = 0;
      try {
          startPattern = findGuardPattern(row, endStart, START_PATTERN, START_PATTERN_LEN);

          // Determine the width of a narrow line in pixels. We can do this by
          // getting the width of the start pattern and dividing by 4 because its
          // made up of 4 narrow lines.
          narrowLineWidth = (startPattern[1] - startPattern[0]) >> 2;
          validateQuietZone(row, startPattern[0]);
          return startPattern;
      } catch (ReaderException const& re) {
          delete [] startPattern;
        throw re;
      }
    }

    /**
     * Identify where the end of the middle / payload section ends.
     *
     * @param row row of black/white values to search
     * @return Array, containing index of start of 'end block' and end of 'end
     *         block'
     * @throws ReaderException
     */

    int* ITFReader::decodeEnd(Ref<BitArray> row) {
      // For convenience, reverse the row and then
      // search from 'the start' for the end block
      row->reverse();
                        int* endPattern = 0;
      try {
        int endStart = skipWhiteSpace(row);
        endPattern = findGuardPattern(row, endStart, END_PATTERN_REVERSED, END_PATTERN_REVERSED_LEN);

        // The start & end patterns must be pre/post fixed by a quiet zone. This
        // zone must be at least 10 times the width of a narrow line.
        // ref: http://www.barcode-1.net/i25code.html
        validateQuietZone(row, endPattern[0]);

        // Now recalculate the indices of where the 'endblock' starts & stops to
        // accommodate
        // the reversed nature of the search
        int temp = endPattern[0];
        endPattern[0] = row->getSize() - endPattern[1];
        endPattern[1] = row->getSize() - temp;

        row->reverse();
        return endPattern;
      } catch (ReaderException const& re) {
                                delete [] endPattern;
        row->reverse();
        throw re;
      }
    }

    /**
     * The start & end patterns must be pre/post fixed by a quiet zone. This
     * zone must be at least 10 times the width of a narrow line.  Scan back until
     * we either get to the start of the barcode or match the necessary number of
     * quiet zone pixels.
     *
     * Note: Its assumed the row is reversed when using this method to find
     * quiet zone after the end pattern.
     *
     * ref: http://www.barcode-1.net/i25code.html
     *
     * @param row bit array representing the scanned barcode.
     * @param startPattern index into row of the start or end pattern.
     * @throws ReaderException if the quiet zone cannot be found, a ReaderException is thrown.
     */
    void ITFReader::validateQuietZone(Ref<BitArray> row, int startPattern) {
      (void)row;
      (void)startPattern;
//#pragma mark needs some corrections
//      int quietCount = narrowLineWidth * 10;  // expect to find this many pixels of quiet zone
//
//      for (int i = startPattern - 1; quietCount > 0 && i >= 0; i--) {
//        if (row->get(i)) {
//          break;
//        }
//        quietCount--;
//      }
//      if (quietCount != 0) {
//        // Unable to find the necessary number of quiet zone pixels.
//        throw ReaderException("Unable to find the necessary number of quiet zone pixels");
//      }
    }

    /**
     * Skip all whitespace until we get to the first black line.
     *
     * @param row row of black/white values to search
     * @return index of the first black line.
     * @throws ReaderException Throws exception if no black lines are found in the row
     */
    int ITFReader::skipWhiteSpace(Ref<BitArray> row) {
      int width = row->getSize();
      int endStart = 0;
      while (endStart < width) {
        if (row->get(endStart)) {
          break;
        }
        endStart++;
      }
      if (endStart == width) {
        throw ReaderException("");
      }
      return endStart;
    }

    /**
     * @param row       row of black/white values to search
     * @param rowOffset position to start search
     * @param pattern   pattern of counts of number of black and white pixels that are
     *                  being searched for as a pattern
     * @return start/end horizontal offset of guard pattern, as an array of two
     *         ints
     * @throws ReaderException if pattern is not found
     */
    int* ITFReader::findGuardPattern(Ref<BitArray> row, int rowOffset, const int pattern[],
        int patternLen) {
      // TODO: This is very similar to implementation in UPCEANReader. Consider if they can be
      // merged to a single method.
      int patternLength = patternLen;
      int counters[patternLength];
      for (int i=0; i<patternLength; i++) {
        counters[i] = 0;
      }
      int width = row->getSize();
      bool isWhite = false;

      int counterPosition = 0;
      int patternStart = rowOffset;
      for (int x = rowOffset; x < width; x++) {
        bool pixel = row->get(x);
        if (pixel ^ isWhite) {
          counters[counterPosition]++;
        } else {
          if (counterPosition == patternLength - 1) {
            if (patternMatchVariance(counters, patternLength, pattern,
                MAX_INDIVIDUAL_VARIANCE) < MAX_AVG_VARIANCE) {
              int* resultValue = new int[2];
              resultValue[0] = patternStart;
              resultValue[1] = x;
              return resultValue;
            }
            patternStart += counters[0] + counters[1];
            for (int y = 2; y < patternLength; y++) {
              counters[y - 2] = counters[y];
            }
            counters[patternLength - 2] = 0;
            counters[patternLength - 1] = 0;
            counterPosition--;
          } else {
            counterPosition++;
          }
          counters[counterPosition] = 1;
          isWhite = !isWhite;
        }
      }
      throw ReaderException("");
    }

    /**
     * Attempts to decode a sequence of ITF black/white lines into single
     * digit.
     *
     * @param counters the counts of runs of observed black/white/black/... values
     * @return The decoded digit
     * @throws ReaderException if digit cannot be decoded
     */
    int ITFReader::decodeDigit(int counters[], int countersLen){
      unsigned int bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
      int bestMatch = -1;
      int max = PATTERNS_LEN;
      for (int i = 0; i < max; i++) {
        int pattern[countersLen];
        for(int ind = 0; ind<countersLen; ind++){
          pattern[ind] = PATTERNS[i][ind];
        }
        unsigned int variance = patternMatchVariance(counters, countersLen, pattern,
            MAX_INDIVIDUAL_VARIANCE);
        if (variance < bestVariance) {
          bestVariance = variance;
          bestMatch = i;
        }
      }
      if (bestMatch >= 0) {
        return bestMatch;
      } else {
        throw ReaderException("digit didint found");
      }
    }

    ITFReader::~ITFReader(){
    }
  }
}

// file: zxing/oned/MultiFormatOneDReader.cpp

/*
 *  MultiFormatOneDReader.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "MultiFormatOneDReader.h"

// #include <zxing/oned/MultiFormatUPCEANReader.h>
// #include <zxing/oned/Code39Reader.h>
// #include <zxing/oned/Code128Reader.h>
// #include <zxing/oned/ITFReader.h>
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {
    MultiFormatOneDReader::MultiFormatOneDReader(DecodeHints hints) : readers() {
      if (hints.containsFormat(BarcodeFormat_EAN_13) ||
          hints.containsFormat(BarcodeFormat_EAN_8) ||
          hints.containsFormat(BarcodeFormat_UPC_A) ||
          hints.containsFormat(BarcodeFormat_UPC_E)) {
        readers.push_back(Ref<OneDReader>(new MultiFormatUPCEANReader(hints)));
      }
      if (hints.containsFormat(BarcodeFormat_CODE_39)) {
        readers.push_back(Ref<OneDReader>(new Code39Reader()));
      }
      if (hints.containsFormat(BarcodeFormat_CODE_128)) {
        readers.push_back(Ref<OneDReader>(new Code128Reader()));
      }
      if (hints.containsFormat(BarcodeFormat_ITF)) {
        readers.push_back(Ref<OneDReader>(new ITFReader()));
      }
      if (readers.size() == 0) {
        readers.push_back(Ref<OneDReader>(new MultiFormatUPCEANReader(hints)));
        readers.push_back(Ref<OneDReader>(new Code39Reader()));
        readers.push_back(Ref<OneDReader>(new Code128Reader()));
        readers.push_back(Ref<OneDReader>(new ITFReader()));
      }
    }

    Ref<Result> MultiFormatOneDReader::decodeRow(int rowNumber, Ref<BitArray> row) {
      int size = readers.size();
      for (int i = 0; i < size; i++) {
        OneDReader* reader = readers[i];
        Ref<Result> result = reader->decodeRow(rowNumber, row);
        if (!result.empty()) {
          return result;
        }
      }
      return Ref<Result>();
    }
  }
}

// file: zxing/oned/MultiFormatUPCEANReader.cpp

/*
 *  MultiFormatUPCEANReader.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// #include "MultiFormatUPCEANReader.h"

// #include <zxing/oned/EAN13Reader.h>
// #include <zxing/oned/EAN8Reader.h>
// #include <zxing/oned/UPCEReader.h>
// #include <zxing/oned/UPCAReader.h>
// #include <zxing/oned/OneDResultPoint.h>
// #include <zxing/common/Array.h>
// #include <zxing/ReaderException.h>
// #include <math.h>

namespace zxing {
  namespace oned {

    MultiFormatUPCEANReader::MultiFormatUPCEANReader(DecodeHints hints) : readers() {
      if (hints.containsFormat(BarcodeFormat_EAN_13)) {
        readers.push_back(Ref<OneDReader>(new EAN13Reader()));
      } else if (hints.containsFormat(BarcodeFormat_UPC_A)) {
        readers.push_back(Ref<OneDReader>(new UPCAReader()));
      }
      if (hints.containsFormat(BarcodeFormat_EAN_8)) {
        readers.push_back(Ref<OneDReader>(new EAN8Reader()));
      }
      if (hints.containsFormat(BarcodeFormat_UPC_E)) {
        readers.push_back(Ref<OneDReader>(new UPCEReader()));
      }
      if (readers.size() == 0) {
        readers.push_back(Ref<OneDReader>(new EAN13Reader()));
        // UPC-A is covered by EAN-13
        readers.push_back(Ref<OneDReader>(new EAN8Reader()));
        readers.push_back(Ref<OneDReader>(new UPCEReader()));
      }
    }

    Ref<Result> MultiFormatUPCEANReader::decodeRow(int rowNumber, Ref<BitArray> row) {
      // Compute this location once and reuse it on multiple implementations
      int size = readers.size();
      for (int i = 0; i < size; i++) {
        Ref<OneDReader> reader = readers[i];
        Ref<Result> result = reader->decodeRow(rowNumber, row);
        if (result.empty()) {
          continue;
        }

        // Special case: a 12-digit code encoded in UPC-A is identical to a "0"
        // followed by those 12 digits encoded as EAN-13. Each will recognize such a code,
        // UPC-A as a 12-digit string and EAN-13 as a 13-digit string starting with "0".
        // Individually these are correct and their readers will both read such a code
        // and correctly call it EAN-13, or UPC-A, respectively.
        //
        // In this case, if we've been looking for both types, we'd like to call it
        // a UPC-A code. But for efficiency we only run the EAN-13 decoder to also read
        // UPC-A. So we special case it here, and convert an EAN-13 result to a UPC-A
        // result if appropriate.
        if (result->getBarcodeFormat() == BarcodeFormat_EAN_13) {
          const std::string& text = (result->getText())->getText();
          if (text[0] == '0') {
            Ref<String> resultString(new String(text.substr(1)));
            Ref<Result> res(new Result(resultString, result->getRawBytes(),
                result->getResultPoints(), BarcodeFormat_UPC_A));
            return res;
          }
        }
        return result;
      }
      return Ref<Result>();
    }
  }
}

// file: zxing/oned/OneDReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  OneDReader.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "OneDReader.h"
// #include <zxing/ReaderException.h>
// #include <zxing/oned/OneDResultPoint.h>
// #include <math.h>
// #include <limits.h>

namespace zxing {
  namespace oned {
    using namespace std;

    OneDReader::OneDReader() {
    }

    Ref<Result> OneDReader::decode(Ref<BinaryBitmap> image, DecodeHints hints) {
      Ref<Result> result = doDecode(image, hints);
      if (result.empty() && hints.getTryHarder() && image->isRotateSupported()) {
        Ref<BinaryBitmap> rotatedImage(image->rotateCounterClockwise());
        result = doDecode(rotatedImage, hints);
        if (!result.empty()) {
          /*
          // Record that we found it rotated 90 degrees CCW / 270 degrees CW
          Hashtable metadata = result.getResultMetadata();
          int orientation = 270;
          if (metadata != null && metadata.containsKey(ResultMetadataType.ORIENTATION)) {
            // But if we found it reversed in doDecode(), add in that result here:
            orientation = (orientation +
                     ((Integer) metadata.get(ResultMetadataType.ORIENTATION)).intValue()) % 360;
          }
          result.putMetadata(ResultMetadataType.ORIENTATION, new Integer(orientation));
          */
          // Update result points
          std::vector<Ref<ResultPoint> >& points (result->getResultPoints());
          int height = rotatedImage->getHeight();
          for (size_t i = 0; i < points.size(); i++) {
            points[i].reset(new OneDResultPoint(height - points[i]->getY() - 1, points[i]->getX()));
          }
        }
      }
      if (result.empty()) {
        throw ReaderException("");
      }
      return result;
    }

    Ref<Result> OneDReader::doDecode(Ref<BinaryBitmap> image, DecodeHints hints) {
      int width = image->getWidth();
      int height = image->getHeight();
      Ref<BitArray> row(new BitArray(width));
      int middle = height >> 1;
      bool tryHarder = hints.getTryHarder();
      int rowStep = (int)fmax(1, height >> (tryHarder ? 8 : 5));
      int maxLines;
      if (tryHarder) {
        maxLines = height; // Look at the whole image, not just the center
      } else {
        maxLines = 15; // 15 rows spaced 1/32 apart is roughly the middle half of the image
      }

      for (int x = 0; x < maxLines; x++) {
        // Scanning from the middle out. Determine which row we're looking at next:
        int rowStepsAboveOrBelow = (x + 1) >> 1;
        bool isAbove = (x & 0x01) == 0; // i.e. is x even?
        int rowNumber = middle + rowStep * (isAbove ? rowStepsAboveOrBelow : -rowStepsAboveOrBelow);
        if (rowNumber < 0 || rowNumber >= height) {
          // Oops, if we run off the top or bottom, stop
          break;
        }

        // Estimate black point for this row and load it:
        try {
          row = image->getBlackRow(rowNumber, row);
        } catch (ReaderException const& re) {
          continue;
        } catch (IllegalArgumentException const& re) {
          continue;
        }

        // While we have the image data in a BitArray, it's fairly cheap to reverse it in place to
        // handle decoding upside down barcodes.
        for (int attempt = 0; attempt < 2; attempt++) {
          if (attempt == 1) {
            row->reverse(); // reverse the row and continue
          }

          // Look for a barcode
          Ref<Result> result = decodeRow(rowNumber, row);
          // We found our barcode
          if (!result.empty()) {
            if (attempt == 1) {
              // But it was upside down, so note that
              // result.putMetadata(ResultMetadataType.ORIENTATION, new Integer(180));
              // And remember to flip the result points horizontally.
              std::vector<Ref<ResultPoint> > points(result->getResultPoints());
              // if there's exactly two points (which there should be), flip the x coordinate
              // if there's not exactly 2, I don't know what do do with it
              if (points.size() == 2) {
                Ref<ResultPoint> pointZero(new OneDResultPoint(width - points[0]->getX() - 1,
                    points[0]->getY()));
                points[0] = pointZero;

                Ref<ResultPoint> pointOne(new OneDResultPoint(width - points[1]->getX() - 1,
                    points[1]->getY()));
                points[1] = pointOne;

                result.reset(new Result(result->getText(), result->getRawBytes(), points,
                    result->getBarcodeFormat()));
              }
            }
            return result;
          }
        }
      }
      return Ref<Result>();
    }

    unsigned int OneDReader::patternMatchVariance(int counters[], int countersSize,
        const int pattern[], int maxIndividualVariance) {
      int numCounters = countersSize;
      unsigned int total = 0;
      unsigned int patternLength = 0;
      for (int i = 0; i < numCounters; i++) {
        total += counters[i];
        patternLength += pattern[i];
      }
      if (total < patternLength) {
        // If we don't even have one pixel per unit of bar width, assume this is too small
        // to reliably match, so fail:
        return INT_MAX;
      }
      // We're going to fake floating-point math in integers. We just need to use more bits.
      // Scale up patternLength so that intermediate values below like scaledCounter will have
      // more "significant digits"
      unsigned int unitBarWidth = (total << INTEGER_MATH_SHIFT) / patternLength;
      maxIndividualVariance = (maxIndividualVariance * unitBarWidth) >> INTEGER_MATH_SHIFT;

      unsigned int totalVariance = 0;
      for (int x = 0; x < numCounters; x++) {
        int counter = counters[x] << INTEGER_MATH_SHIFT;
        int scaledPattern = pattern[x] * unitBarWidth;
        int variance = counter > scaledPattern ? counter - scaledPattern : scaledPattern - counter;
        if (variance > maxIndividualVariance) {
          return INT_MAX;
        }
        totalVariance += variance;
      }
      return totalVariance / total;
    }

    bool OneDReader::recordPattern(Ref<BitArray> row, int start, int counters[], int countersCount) {
      int numCounters = countersCount;//sizeof(counters) / sizeof(int);
      for (int i = 0; i < numCounters; i++) {
        counters[i] = 0;
      }
      int end = row->getSize();
      if (start >= end) {
        return false;
      }
      bool isWhite = !row->get(start);
      int counterPosition = 0;
      int i = start;
      while (i < end) {
        bool pixel = row->get(i);
        if (pixel ^ isWhite) { // that is, exactly one is true
          counters[counterPosition]++;
        } else {
          counterPosition++;
          if (counterPosition == numCounters) {
            break;
          } else {
            counters[counterPosition] = 1;
            isWhite ^= true; // isWhite = !isWhite;
          }
        }
        i++;
      }
      // If we read fully the last section of pixels and filled up our counters -- or filled
      // the last counter but ran off the side of the image, OK. Otherwise, a problem.
      if (!(counterPosition == numCounters || (counterPosition == numCounters - 1 && i == end))) {
        return false;
      }
      return true;
    }

    OneDReader::~OneDReader() {
    }
  }
}

// file: zxing/oned/OneDResultPoint.cpp

/*
 *  OneDResultPoint.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "OneDResultPoint.h"

namespace zxing {
	namespace oned {

		OneDResultPoint::OneDResultPoint(float posX, float posY) : ResultPoint(posX,posY) {
		}
	}
}

// file: zxing/oned/UPCAReader.cpp

/*
 *  UPCAReader.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "UPCAReader.h"
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {
    UPCAReader::UPCAReader() : ean13Reader() {
    }

    Ref<Result> UPCAReader::decodeRow(int rowNumber, Ref<BitArray> row) {
      return maybeReturnResult(ean13Reader.decodeRow(rowNumber, row));
    }

    Ref<Result> UPCAReader::decodeRow(int rowNumber, Ref<BitArray> row, int startGuardBegin,
        int startGuardEnd) {
      return maybeReturnResult(ean13Reader.decodeRow(rowNumber, row, startGuardBegin,
          startGuardEnd));
    }

    Ref<Result> UPCAReader::decode(Ref<BinaryBitmap> image, DecodeHints hints) {
      return maybeReturnResult(ean13Reader.decode(image, hints));
    }

    int UPCAReader::decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
        std::string& resultString) {
      return ean13Reader.decodeMiddle(row, startGuardBegin, startGuardEnd, resultString);
    }

    Ref<Result> UPCAReader::maybeReturnResult(Ref<Result> result) {
      if (result.empty()) {
        return result;
      }
      const std::string& text = (result->getText())->getText();
      if (text[0] == '0') {
        Ref<String> resultString(new String(text.substr(1)));
        Ref<Result> res(new Result(resultString, result->getRawBytes(), result->getResultPoints(),
            BarcodeFormat_UPC_A));
        return res;
      }
      return Ref<Result>();
    }

    BarcodeFormat UPCAReader::getBarcodeFormat(){
      return BarcodeFormat_UPC_A;
    }
  }
}

// file: zxing/oned/UPCEANReader.cpp

/*
 *  UPCEANReader.cpp
 *  ZXing
 *
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "UPCEANReader.h"
// #include <zxing/oned/OneDResultPoint.h>
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {

    /**
     * Start/end guard pattern.
     */
    static const int START_END_PATTERN[3] = {1, 1, 1};

    /**
     * Pattern marking the middle of a UPC/EAN pattern, separating the two halves.
     */
    static const int MIDDLE_PATTERN_LEN = 5;
    static const int MIDDLE_PATTERN[MIDDLE_PATTERN_LEN] = {1, 1, 1, 1, 1};

    /**
     * "Odd", or "L" patterns used to encode UPC/EAN digits.
     */
    const int L_PATTERNS_LEN = 10;
    const int L_PATTERNS_SUB_LEN = 4;
    const int L_PATTERNS[L_PATTERNS_LEN][L_PATTERNS_SUB_LEN] = {
      {3, 2, 1, 1}, // 0
      {2, 2, 2, 1}, // 1
      {2, 1, 2, 2}, // 2
      {1, 4, 1, 1}, // 3
      {1, 1, 3, 2}, // 4
      {1, 2, 3, 1}, // 5
      {1, 1, 1, 4}, // 6
      {1, 3, 1, 2}, // 7
      {1, 2, 1, 3}, // 8
      {3, 1, 1, 2}  // 9
    };

    /**
     * As above but also including the "even", or "G" patterns used to encode UPC/EAN digits.
     */
    const int L_AND_G_PATTERNS_LEN = 20;
    const int L_AND_G_PATTERNS_SUB_LEN = 4;
    const int L_AND_G_PATTERNS[L_AND_G_PATTERNS_LEN][L_AND_G_PATTERNS_SUB_LEN] = {
      {3, 2, 1, 1}, // 0
      {2, 2, 2, 1}, // 1
      {2, 1, 2, 2}, // 2
      {1, 4, 1, 1}, // 3
      {1, 1, 3, 2}, // 4
      {1, 2, 3, 1}, // 5
      {1, 1, 1, 4}, // 6
      {1, 3, 1, 2}, // 7
      {1, 2, 1, 3}, // 8
      {3, 1, 1, 2}, // 9
      {1, 1, 2, 3}, // 10 reversed 0
      {1, 2, 2, 2}, // 11 reversed 1
      {2, 2, 1, 2}, // 12 reversed 2
      {1, 1, 4, 1}, // 13 reversed 3
      {2, 3, 1, 1}, // 14 reversed 4
      {1, 3, 2, 1}, // 15 reversed 5
      {4, 1, 1, 1}, // 16 reversed 6
      {2, 1, 3, 1}, // 17 reversed 7
      {3, 1, 2, 1}, // 18 reversed 8
      {2, 1, 1, 3}  // 19 reversed 9
    };


    int UPCEANReader::getMIDDLE_PATTERN_LEN() {
      return MIDDLE_PATTERN_LEN;
    }

    const int* UPCEANReader::getMIDDLE_PATTERN() {
      return MIDDLE_PATTERN;
    }

    UPCEANReader::UPCEANReader() {
    }


    Ref<Result> UPCEANReader::decodeRow(int rowNumber, Ref<BitArray> row) {
      int rangeStart;
      int rangeEnd;
			if (findStartGuardPattern(row, &rangeStart, &rangeEnd)) {
        try {
          return decodeRow(rowNumber, row, rangeStart, rangeEnd);
        } catch (ReaderException const& re) {
        }
			}
			return Ref<Result>();
    }

    Ref<Result> UPCEANReader::decodeRow(int rowNumber, Ref<BitArray> row, int startGuardBegin,
        int startGuardEnd) {
      std::string tmpResultString;
      std::string& tmpResultStringRef = tmpResultString;
      int endStart = decodeMiddle(row, startGuardBegin, startGuardEnd, tmpResultStringRef);
      if (endStart < 0) {
        return Ref<Result>();
      }

      int endGuardBegin;
      int endGuardEnd;
      if (!decodeEnd(row, endStart, &endGuardBegin, &endGuardEnd)) {
        return Ref<Result>();
      }

      // Make sure there is a quiet zone at least as big as the end pattern after the barcode.
      // The spec might want more whitespace, but in practice this is the maximum we can count on.
      size_t quietEnd = endGuardEnd + (endGuardEnd - endGuardBegin);
      if (quietEnd >= row->getSize() || !row->isRange(endGuardEnd, quietEnd, false)) {
        return Ref<Result>();
      }

      if (!checkChecksum(tmpResultString)) {
        return Ref<Result>();
      }

      Ref<String> resultString(new String(tmpResultString));
      float left = (float) (startGuardBegin + startGuardEnd) / 2.0f;
      float right = (float) (endGuardBegin + endGuardEnd) / 2.0f;

      std::vector< Ref<ResultPoint> > resultPoints(2);
      Ref<OneDResultPoint> resultPoint1(new OneDResultPoint(left, (float) rowNumber));
      Ref<OneDResultPoint> resultPoint2(new OneDResultPoint(right, (float) rowNumber));
      resultPoints[0] = resultPoint1;
      resultPoints[1] = resultPoint2;

      ArrayRef<unsigned char> resultBytes(1);
      return Ref<Result>(new Result(resultString, resultBytes, resultPoints, getBarcodeFormat()));
    }

    bool UPCEANReader::findStartGuardPattern(Ref<BitArray> row, int* rangeStart, int* rangeEnd) {
      int nextStart = 0;
      while (findGuardPattern(row, nextStart, false, START_END_PATTERN,
          sizeof(START_END_PATTERN) / sizeof(int), rangeStart, rangeEnd)) {
        int start = *rangeStart;
        nextStart = *rangeEnd;
        // Make sure there is a quiet zone at least as big as the start pattern before the barcode.
        // If this check would run off the left edge of the image, do not accept this barcode,
        // as it is very likely to be a false positive.
        int quietStart = start - (nextStart - start);
        if (quietStart >= 0 && row->isRange(quietStart, start, false)) {
          return true;
        }
      }
      return false;
    }

    bool UPCEANReader::findGuardPattern(Ref<BitArray> row, int rowOffset, bool whiteFirst,
        const int pattern[], int patternLen, int* start, int* end) {
      int patternLength = patternLen;
      int counters[patternLength];
      int countersCount = sizeof(counters) / sizeof(int);
      for (int i = 0; i < countersCount; i++) {
        counters[i] = 0;
      }
      int width = row->getSize();
      bool isWhite = false;
      while (rowOffset < width) {
        isWhite = !row->get(rowOffset);
        if (whiteFirst == isWhite) {
          break;
        }
        rowOffset++;
      }

      int counterPosition = 0;
      int patternStart = rowOffset;
      for (int x = rowOffset; x < width; x++) {
        bool pixel = row->get(x);
        if (pixel ^ isWhite) {
          counters[counterPosition]++;
        } else {
          if (counterPosition == patternLength - 1) {
            if (patternMatchVariance(counters, countersCount, pattern,
                MAX_INDIVIDUAL_VARIANCE) < MAX_AVG_VARIANCE) {
              *start = patternStart;
              *end = x;
              return true;
            }
            patternStart += counters[0] + counters[1];
            for (int y = 2; y < patternLength; y++) {
              counters[y - 2] = counters[y];
            }
            counters[patternLength - 2] = 0;
            counters[patternLength - 1] = 0;
            counterPosition--;
          } else {
            counterPosition++;
          }
          counters[counterPosition] = 1;
          isWhite = !isWhite;
        }
      }
      return false;
    }

    bool UPCEANReader::decodeEnd(Ref<BitArray> row, int endStart, int* endGuardBegin,
        int* endGuardEnd) {
      return findGuardPattern(row, endStart, false, START_END_PATTERN,
          sizeof(START_END_PATTERN) / sizeof(int), endGuardBegin, endGuardEnd);
    }

    int UPCEANReader::decodeDigit(Ref<BitArray> row, int counters[], int countersLen, int rowOffset,
        UPC_EAN_PATTERNS patternType) {
      if (!recordPattern(row, rowOffset, counters, countersLen)) {
        return -1;
      }
      unsigned int bestVariance = MAX_AVG_VARIANCE; // worst variance we'll accept
      int bestMatch = -1;

      int max = 0;
      switch (patternType) {
        case UPC_EAN_PATTERNS_L_PATTERNS:
          max = L_PATTERNS_LEN;
          for (int i = 0; i < max; i++) {
            int pattern[countersLen];
            for(int j = 0; j< countersLen; j++){
              pattern[j] = L_PATTERNS[i][j];
            }

            unsigned int variance = patternMatchVariance(counters, countersLen, pattern,
                MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
              bestVariance = variance;
              bestMatch = i;
            }
          }
          break;
        case UPC_EAN_PATTERNS_L_AND_G_PATTERNS:
          max = L_AND_G_PATTERNS_LEN;
          for (int i = 0; i < max; i++) {
            int pattern[countersLen];
            for(int j = 0; j< countersLen; j++){
              pattern[j] = L_AND_G_PATTERNS[i][j];
            }

            unsigned int variance = patternMatchVariance(counters, countersLen, pattern,
                MAX_INDIVIDUAL_VARIANCE);
            if (variance < bestVariance) {
              bestVariance = variance;
              bestMatch = i;
            }
          }
          break;
        default:
          break;
      }
      return bestMatch;
    }

    /**
     * @return {@link #checkStandardUPCEANChecksum(String)}
     */
    bool UPCEANReader::checkChecksum(std::string s) {
      return checkStandardUPCEANChecksum(s);
    }

    /**
     * Computes the UPC/EAN checksum on a string of digits, and reports
     * whether the checksum is correct or not.
     *
     * @param s string of digits to check
     * @return true iff string of digits passes the UPC/EAN checksum algorithm
     */
    bool UPCEANReader::checkStandardUPCEANChecksum(std::string s) {
      int length = s.length();
      if (length == 0) {
        return false;
      }

      int sum = 0;
      for (int i = length - 2; i >= 0; i -= 2) {
        int digit = (int) s[i] - (int) '0';
        if (digit < 0 || digit > 9) {
          return false;
        }
        sum += digit;
      }
      sum *= 3;
      for (int i = length - 1; i >= 0; i -= 2) {
        int digit = (int) s[i] - (int) '0';
        if (digit < 0 || digit > 9) {
          return false;
        }
        sum += digit;
      }
      return sum % 10 == 0;
    }

    UPCEANReader::~UPCEANReader() {
    }
  }
}

// file: zxing/oned/UPCEReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Copyright 2010 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "UPCEReader.h"
// #include <zxing/ReaderException.h>

namespace zxing {
  namespace oned {

    /**
     * The pattern that marks the middle, and end, of a UPC-E pattern.
     * There is no "second half" to a UPC-E barcode.
     */
    static const int MIDDLE_END_PATTERN[6] = {1, 1, 1, 1, 1, 1};

    /**
     * See {@link #L_AND_G_PATTERNS}; these values similarly represent patterns of
     * even-odd parity encodings of digits that imply both the number system (0 or 1)
     * used, and the check digit.
     */
    static const int NUMSYS_AND_CHECK_DIGIT_PATTERNS[2][10] = {
      {0x38, 0x34, 0x32, 0x31, 0x2C, 0x26, 0x23, 0x2A, 0x29, 0x25},
      {0x07, 0x0B, 0x0D, 0x0E, 0x13, 0x19, 0x1C, 0x15, 0x16, 0x1A}
    };

    UPCEReader::UPCEReader() {
    }

    int UPCEReader::decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
        std::string& resultString) {
      (void)startGuardBegin;
      const int countersLen = 4;
      int counters[countersLen] = { 0, 0, 0, 0 };

      int end = row->getSize();
      int rowOffset = startGuardEnd;
      int lgPatternFound = 0;

      for (int x = 0; x < 6 && rowOffset < end; x++) {
        int bestMatch = decodeDigit(row, counters, countersLen, rowOffset,
            UPC_EAN_PATTERNS_L_AND_G_PATTERNS);
        if (bestMatch < 0) {
          return -1;
        }
        resultString.append(1, (char) ('0' + bestMatch % 10));
        for (int i = 0; i < countersLen; i++) {
          rowOffset += counters[i];
        }
        if (bestMatch >= 10) {
          lgPatternFound |= 1 << (5 - x);
        }
      }

      if (!determineNumSysAndCheckDigit(resultString, lgPatternFound)) {
        return -1;
      }
      return rowOffset;
    }

    bool UPCEReader::decodeEnd(Ref<BitArray> row, int endStart, int* endGuardBegin,
        int* endGuardEnd) {
      return findGuardPattern(row, endStart, true, MIDDLE_END_PATTERN,
          sizeof(MIDDLE_END_PATTERN) / sizeof(int), endGuardBegin, endGuardEnd);
    }

    bool UPCEReader::checkChecksum(std::string s){
      return UPCEANReader::checkChecksum(convertUPCEtoUPCA(s));
    }


    bool UPCEReader::determineNumSysAndCheckDigit(std::string& resultString, int lgPatternFound) {
      for (int numSys = 0; numSys <= 1; numSys++) {
        for (int d = 0; d < 10; d++) {
          if (lgPatternFound == NUMSYS_AND_CHECK_DIGIT_PATTERNS[numSys][d]) {
            resultString.insert(0, 1, (char) ('0' + numSys));
            resultString.append(1, (char) ('0' + d));
            return true;
          }
        }
      }
      return false;
    }

    /**
     * Expands a UPC-E value back into its full, equivalent UPC-A code value.
     *
     * @param upce UPC-E code as string of digits
     * @return equivalent UPC-A code as string of digits
     */
    std::string UPCEReader::convertUPCEtoUPCA(std::string upce) {
      std::string result;
      result.append(1, upce[0]);
      char lastChar = upce[6];
      switch (lastChar) {
        case '0':
        case '1':
        case '2':
          result.append(upce.substr(1,2));
          result.append(1, lastChar);
          result.append("0000");
          result.append(upce.substr(3,3));
          break;
        case '3':
          result.append(upce.substr(1,3));
          result.append("00000");
          result.append(upce.substr(4,2));
          break;
        case '4':
          result.append(upce.substr(1,4));
          result.append("00000");
          result.append(1, upce[5]);
          break;
        default:
          result.append(upce.substr(1,5));
          result.append("0000");
          result.append(1, lastChar);
          break;
      }
      result.append(1, upce[7]);
      return result;
    }


    BarcodeFormat UPCEReader::getBarcodeFormat() {
      return BarcodeFormat_UPC_E;
    }
  }
}

// file: zxing/qrcode/ErrorCorrectionLevel.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  ErrorCorrectionLevel.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 15/05/2008.
 *  Copyright 2008-2011 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/ErrorCorrectionLevel.h>

using std::string;

namespace zxing {
namespace qrcode {

ErrorCorrectionLevel::ErrorCorrectionLevel(int inOrdinal,
                                           int bits,
                                           char const* name) :
  ordinal_(inOrdinal), bits_(bits), name_(name) {}

int ErrorCorrectionLevel::ordinal() const {
  return ordinal_;
}

int ErrorCorrectionLevel::bits() const {
  return bits_;
}

string const& ErrorCorrectionLevel::name() const {
  return name_;
}

ErrorCorrectionLevel::operator string const& () const {
  return name_;
}

ErrorCorrectionLevel& ErrorCorrectionLevel::forBits(int bits) {
  if (bits < 0 || bits >= N_LEVELS) {
    throw ReaderException("Ellegal error correction level bits");
  }
  return *FOR_BITS[bits];
}

  ErrorCorrectionLevel ErrorCorrectionLevel::L(0, 0x01, "L");
  ErrorCorrectionLevel ErrorCorrectionLevel::M(1, 0x00, "M");
  ErrorCorrectionLevel ErrorCorrectionLevel::Q(2, 0x03, "Q");
  ErrorCorrectionLevel ErrorCorrectionLevel::H(3, 0x02, "H");
ErrorCorrectionLevel *ErrorCorrectionLevel::FOR_BITS[] = { &M, &L, &H, &Q };
int ErrorCorrectionLevel::N_LEVELS = 4;

}
}

// file: zxing/qrcode/FormatInformation.cpp

/*
 *  FormatInformation.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 18/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/FormatInformation.h>
// #include <limits>

namespace zxing {
namespace qrcode {

using namespace std;

int FormatInformation::FORMAT_INFO_MASK_QR = 0x5412;
int FormatInformation::FORMAT_INFO_DECODE_LOOKUP[][2] = { { 0x5412, 0x00 }, { 0x5125, 0x01 }, { 0x5E7C, 0x02 }, {
    0x5B4B, 0x03 }, { 0x45F9, 0x04 }, { 0x40CE, 0x05 }, { 0x4F97, 0x06 }, { 0x4AA0, 0x07 }, { 0x77C4, 0x08 }, {
    0x72F3, 0x09 }, { 0x7DAA, 0x0A }, { 0x789D, 0x0B }, { 0x662F, 0x0C }, { 0x6318, 0x0D }, { 0x6C41, 0x0E }, {
    0x6976, 0x0F }, { 0x1689, 0x10 }, { 0x13BE, 0x11 }, { 0x1CE7, 0x12 }, { 0x19D0, 0x13 }, { 0x0762, 0x14 }, {
    0x0255, 0x15 }, { 0x0D0C, 0x16 }, { 0x083B, 0x17 }, { 0x355F, 0x18 }, { 0x3068, 0x19 }, { 0x3F31, 0x1A }, {
    0x3A06, 0x1B }, { 0x24B4, 0x1C }, { 0x2183, 0x1D }, { 0x2EDA, 0x1E }, { 0x2BED, 0x1F },
};
int FormatInformation::N_FORMAT_INFO_DECODE_LOOKUPS = 32;

int FormatInformation::BITS_SET_IN_HALF_BYTE[] = { 0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4 };

FormatInformation::FormatInformation(int formatInfo) :
    errorCorrectionLevel_(ErrorCorrectionLevel::forBits((formatInfo >> 3) & 0x03)), dataMask_(
      (unsigned char)(formatInfo & 0x07)) {
}

ErrorCorrectionLevel& FormatInformation::getErrorCorrectionLevel() {
  return errorCorrectionLevel_;
}

unsigned char FormatInformation::getDataMask() {
  return dataMask_;
}

int FormatInformation::numBitsDiffering(unsigned int a, unsigned int b) {
  a ^= b;
  return BITS_SET_IN_HALF_BYTE[a & 0x0F] + BITS_SET_IN_HALF_BYTE[(a >> 4 & 0x0F)] + BITS_SET_IN_HALF_BYTE[(a >> 8
         & 0x0F)] + BITS_SET_IN_HALF_BYTE[(a >> 12 & 0x0F)] + BITS_SET_IN_HALF_BYTE[(a >> 16 & 0x0F)]
         + BITS_SET_IN_HALF_BYTE[(a >> 20 & 0x0F)] + BITS_SET_IN_HALF_BYTE[(a >> 24 & 0x0F)]
         + BITS_SET_IN_HALF_BYTE[(a >> 28 & 0x0F)];
}

Ref<FormatInformation> FormatInformation::decodeFormatInformation(int maskedFormatInfo1, int maskedFormatInfo2) {
  Ref<FormatInformation> result(doDecodeFormatInformation(maskedFormatInfo1, maskedFormatInfo2));
  if (result != 0) {
    return result;
  }
  // Should return null, but, some QR codes apparently
  // do not mask this info. Try again by actually masking the pattern
  // first
  return doDecodeFormatInformation(maskedFormatInfo1 ^ FORMAT_INFO_MASK_QR,
                                   maskedFormatInfo2  ^ FORMAT_INFO_MASK_QR);
}
Ref<FormatInformation> FormatInformation::doDecodeFormatInformation(int maskedFormatInfo1, int maskedFormatInfo2) {
  // Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
  int bestDifference = numeric_limits<int>::max();
  int bestFormatInfo = 0;
  for (int i = 0; i < N_FORMAT_INFO_DECODE_LOOKUPS; i++) {
    int* decodeInfo = FORMAT_INFO_DECODE_LOOKUP[i];
    int targetInfo = decodeInfo[0];
    if (targetInfo == maskedFormatInfo1 || targetInfo == maskedFormatInfo2) {
      // Found an exact match
      Ref<FormatInformation> result(new FormatInformation(decodeInfo[1]));
      return result;
    }
    int bitsDifference = numBitsDiffering(maskedFormatInfo1, targetInfo);
    if (bitsDifference < bestDifference) {
      bestFormatInfo = decodeInfo[1];
      bestDifference = bitsDifference;
    }
    if (maskedFormatInfo1 != maskedFormatInfo2) {
        // also try the other option
        bitsDifference = numBitsDiffering(maskedFormatInfo2, targetInfo);
        if (bitsDifference < bestDifference) {
            bestFormatInfo = decodeInfo[1];
          bestDifference = bitsDifference;
        }
      }
  }
  if (bestDifference <= 3) {
    Ref<FormatInformation> result(new FormatInformation(bestFormatInfo));
    return result;
  }
  Ref<FormatInformation> result;
  return result;
}

bool operator==(const FormatInformation &a, const FormatInformation &b) {
  return &(a.errorCorrectionLevel_) == &(b.errorCorrectionLevel_) && a.dataMask_ == b.dataMask_;
}

ostream& operator<<(ostream& out, const FormatInformation& fi) {
  const FormatInformation *fip = &fi;
  out << "FormatInformation @ " << fip;
  return out;
}

}
}

// file: zxing/qrcode/QRCodeReader.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  QRCodeReader.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/QRCodeReader.h>
// #include <zxing/qrcode/detector/Detector.h>

// #include <iostream>

namespace zxing {
	namespace qrcode {

		using namespace std;

		QRCodeReader::QRCodeReader() :decoder_() {
		}
		//TODO: see if any of the other files in the qrcode tree need tryHarder
		Ref<Result> QRCodeReader::decode(Ref<BinaryBitmap> image, DecodeHints hints) {
#ifdef DEBUG
			cout << "decoding image " << image.object_ << ":\n" << flush;
#endif

			Detector detector(image->getBlackMatrix());


#ifdef DEBUG
			cout << "(1) created detector " << &detector << "\n" << flush;
#endif

			Ref<DetectorResult> detectorResult(detector.detect(hints));
#ifdef DEBUG
			cout << "(2) detected, have detectorResult " << detectorResult.object_ << "\n" << flush;
#endif

			std::vector<Ref<ResultPoint> > points(detectorResult->getPoints());


#ifdef DEBUG
			cout << "(3) extracted points " << &points << "\n" << flush;
			cout << "found " << points.size() << " points:\n";
			for (size_t i = 0; i < points.size(); i++) {
				cout << "   " << points[i]->getX() << "," << points[i]->getY() << "\n";
			}
			cout << "bits:\n";
			cout << *(detectorResult->getBits()) << "\n";
#endif

			Ref<DecoderResult> decoderResult(decoder_.decode(detectorResult->getBits()));
#ifdef DEBUG
			cout << "(4) decoded, have decoderResult " << decoderResult.object_ << "\n" << flush;
#endif

			Ref<Result> result(
							   new Result(decoderResult->getText(), decoderResult->getRawBytes(), points, BarcodeFormat_QR_CODE));
#ifdef DEBUG
			cout << "(5) created result " << result.object_ << ", returning\n" << flush;
#endif

			return result;
		}

		QRCodeReader::~QRCodeReader() {
		}

    Decoder& QRCodeReader::getDecoder() {
        return decoder_;
    }
	}
}

// file: zxing/qrcode/Version.cpp

/*
 *  Version.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 14/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/Version.h>
// #include <zxing/qrcode/FormatInformation.h>
// #include <limits>
// #include <iostream>
// #include <cstdarg>

namespace zxing {
namespace qrcode {
using namespace std;

ECB::ECB(int count, int dataCodewords) :
    count_(count), dataCodewords_(dataCodewords) {
}

int ECB::getCount() {
  return count_;
}

int ECB::getDataCodewords() {
  return dataCodewords_;
}

ECBlocks::ECBlocks(int ecCodewords, ECB *ecBlocks) :
    ecCodewords_(ecCodewords), ecBlocks_(1, ecBlocks) {
}

ECBlocks::ECBlocks(int ecCodewords, ECB *ecBlocks1, ECB *ecBlocks2) :
    ecCodewords_(ecCodewords), ecBlocks_(1, ecBlocks1) {
  ecBlocks_.push_back(ecBlocks2);
}

int ECBlocks::getECCodewords() {
  return ecCodewords_;
}

std::vector<ECB*>& ECBlocks::getECBlocks() {
  return ecBlocks_;
}

ECBlocks::~ECBlocks() {
  for (size_t i = 0; i < ecBlocks_.size(); i++) {
    delete ecBlocks_[i];
  }
}

unsigned int Version::VERSION_DECODE_INFO[] = { 0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6, 0x0C762, 0x0D847, 0x0E60D,
    0x0F928, 0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683, 0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB,
    0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B, 0x2542E, 0x26A64,
    0x27541, 0x28C69
                                              };
int Version::N_VERSION_DECODE_INFOS = 34;
vector<Ref<Version> > Version::VERSIONS;
static int N_VERSIONS = Version::buildVersions();

int Version::getVersionNumber() {
  return versionNumber_;
}

vector<int> &Version::getAlignmentPatternCenters() {
  return alignmentPatternCenters_;
}

int Version::getTotalCodewords() {
  return totalCodewords_;
}

int Version::getDimensionForVersion() {
  return 17 + 4 * versionNumber_;
}

ECBlocks& Version::getECBlocksForLevel(ErrorCorrectionLevel &ecLevel) {
  return *ecBlocks_[ecLevel.ordinal()];
}

Version *Version::getProvisionalVersionForDimension(int dimension) {
  if (dimension % 4 != 1) {
    throw ReaderException("Dimension must be 1 mod 4");
  }
  return Version::getVersionForNumber((dimension - 17) >> 2);
}

Version *Version::getVersionForNumber(int versionNumber) {
  if (versionNumber < 1 || versionNumber > N_VERSIONS) {
    throw ReaderException("versionNumber must be between 1 and 40");
  }

  return VERSIONS[versionNumber - 1];
}

Version::Version(int versionNumber, vector<int> *alignmentPatternCenters, ECBlocks *ecBlocks1, ECBlocks *ecBlocks2,
                 ECBlocks *ecBlocks3, ECBlocks *ecBlocks4) :
    versionNumber_(versionNumber), alignmentPatternCenters_(*alignmentPatternCenters), ecBlocks_(4), totalCodewords_(0) {
  ecBlocks_[0] = ecBlocks1;
  ecBlocks_[1] = ecBlocks2;
  ecBlocks_[2] = ecBlocks3;
  ecBlocks_[3] = ecBlocks4;

  int total = 0;
  int ecCodewords = ecBlocks1->getECCodewords();
  vector<ECB*> &ecbArray = ecBlocks1->getECBlocks();
  for (size_t i = 0; i < ecbArray.size(); i++) {
    ECB *ecBlock = ecbArray[i];
    total += ecBlock->getCount() * (ecBlock->getDataCodewords() + ecCodewords);
  }
  totalCodewords_ = total;
}

Version::~Version() {
  delete &alignmentPatternCenters_;
  for (size_t i = 0; i < ecBlocks_.size(); i++) {
    delete ecBlocks_[i];
  }
}

Version *Version::decodeVersionInformation(unsigned int versionBits) {
  int bestDifference = numeric_limits<int>::max();
  size_t bestVersion = 0;
  for (int i = 0; i < N_VERSION_DECODE_INFOS; i++) {
    unsigned targetVersion = VERSION_DECODE_INFO[i];
    // Do the version info bits match exactly? done.
    if (targetVersion == versionBits) {
      return getVersionForNumber(i + 7);
    }
    // Otherwise see if this is the closest to a real version info bit
    // string we have seen so far
    int bitsDifference = FormatInformation::numBitsDiffering(versionBits, targetVersion);
    if (bitsDifference < bestDifference) {
      bestVersion = i + 7;
      bestDifference = bitsDifference;
    }
  }
  // We can tolerate up to 3 bits of error since no two version info codewords will
  // differ in less than 4 bits.
  if (bestDifference <= 3) {
    return getVersionForNumber(bestVersion);
  }
  // If we didn't find a close enough match, fail
  return 0;
}

Ref<BitMatrix> Version::buildFunctionPattern() {
  int dimension = getDimensionForVersion();
  Ref<BitMatrix> functionPattern(new BitMatrix(dimension));


  // Top left finder pattern + separator + format
  functionPattern->setRegion(0, 0, 9, 9);
  // Top right finder pattern + separator + format
  functionPattern->setRegion(dimension - 8, 0, 8, 9);
  // Bottom left finder pattern + separator + format
  functionPattern->setRegion(0, dimension - 8, 9, 8);


  // Alignment patterns
  size_t max = alignmentPatternCenters_.size();
  for (size_t x = 0; x < max; x++) {
    int i = alignmentPatternCenters_[x] - 2;
    for (size_t y = 0; y < max; y++) {
      if ((x == 0 && (y == 0 || y == max - 1)) || (x == max - 1 && y == 0)) {
        // No alignment patterns near the three finder patterns
        continue;
      }
      functionPattern->setRegion(alignmentPatternCenters_[y] - 2, i, 5, 5);
    }
  }

  // Vertical timing pattern
  functionPattern->setRegion(6, 9, 1, dimension - 17);
  // Horizontal timing pattern
  functionPattern->setRegion(9, 6, dimension - 17, 1);

  if (versionNumber_ > 6) {
    // Version info, top right
    functionPattern->setRegion(dimension - 11, 0, 3, 6);
    // Version info, bottom left
    functionPattern->setRegion(0, dimension - 11, 6, 3);
  }


  //#ifdef DEBUG
  //	cout << "version " << versionNumber_ << " built function pattern:\n";
  //	cout << *functionPattern;
  //#endif

  return functionPattern;
}

static vector<int> *intArray(size_t n...) {
  va_list ap;
  va_start(ap, n);
  vector<int> *result = new vector<int>(n);
  for (size_t i = 0; i < n; i++) {
    (*result)[i] = va_arg(ap, int);
  }
  va_end(ap);
  return result;
}

int Version::buildVersions() {
  VERSIONS.push_back(Ref<Version>(new Version(1, intArray(0),
                                  new ECBlocks(7, new ECB(1, 19)),
                                  new ECBlocks(10, new ECB(1, 16)),
                                  new ECBlocks(13, new ECB(1, 13)),
                                  new ECBlocks(17, new ECB(1, 9)))));
  VERSIONS.push_back(Ref<Version>(new Version(2, intArray(2, 6, 18),
                                  new ECBlocks(10, new ECB(1, 34)),
                                  new ECBlocks(16, new ECB(1, 28)),
                                  new ECBlocks(22, new ECB(1, 22)),
                                  new ECBlocks(28, new ECB(1, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(3, intArray(2, 6, 22),
                                  new ECBlocks(15, new ECB(1, 55)),
                                  new ECBlocks(26, new ECB(1, 44)),
                                  new ECBlocks(18, new ECB(2, 17)),
                                  new ECBlocks(22, new ECB(2, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(4, intArray(2, 6, 26),
                                  new ECBlocks(20, new ECB(1, 80)),
                                  new ECBlocks(18, new ECB(2, 32)),
                                  new ECBlocks(26, new ECB(2, 24)),
                                  new ECBlocks(16, new ECB(4, 9)))));
  VERSIONS.push_back(Ref<Version>(new Version(5, intArray(2, 6, 30),
                                  new ECBlocks(26, new ECB(1, 108)),
                                  new ECBlocks(24, new ECB(2, 43)),
                                  new ECBlocks(18, new ECB(2, 15),
                                               new ECB(2, 16)),
                                  new ECBlocks(22, new ECB(2, 11),
                                               new ECB(2, 12)))));
  VERSIONS.push_back(Ref<Version>(new Version(6, intArray(2, 6, 34),
                                  new ECBlocks(18, new ECB(2, 68)),
                                  new ECBlocks(16, new ECB(4, 27)),
                                  new ECBlocks(24, new ECB(4, 19)),
                                  new ECBlocks(28, new ECB(4, 15)))));
  VERSIONS.push_back(Ref<Version>(new Version(7, intArray(3, 6, 22, 38),
                                  new ECBlocks(20, new ECB(2, 78)),
                                  new ECBlocks(18, new ECB(4, 31)),
                                  new ECBlocks(18, new ECB(2, 14),
                                               new ECB(4, 15)),
                                  new ECBlocks(26, new ECB(4, 13),
                                               new ECB(1, 14)))));
  VERSIONS.push_back(Ref<Version>(new Version(8, intArray(3, 6, 24, 42),
                                  new ECBlocks(24, new ECB(2, 97)),
                                  new ECBlocks(22, new ECB(2, 38),
                                               new ECB(2, 39)),
                                  new ECBlocks(22, new ECB(4, 18),
                                               new ECB(2, 19)),
                                  new ECBlocks(26, new ECB(4, 14),
                                               new ECB(2, 15)))));
  VERSIONS.push_back(Ref<Version>(new Version(9, intArray(3, 6, 26, 46),
                                  new ECBlocks(30, new ECB(2, 116)),
                                  new ECBlocks(22, new ECB(3, 36),
                                               new ECB(2, 37)),
                                  new ECBlocks(20, new ECB(4, 16),
                                               new ECB(4, 17)),
                                  new ECBlocks(24, new ECB(4, 12),
                                               new ECB(4, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(10, intArray(3, 6, 28, 50),
                                  new ECBlocks(18, new ECB(2, 68),
                                               new ECB(2, 69)),
                                  new ECBlocks(26, new ECB(4, 43),
                                               new ECB(1, 44)),
                                  new ECBlocks(24, new ECB(6, 19),
                                               new ECB(2, 20)),
                                  new ECBlocks(28, new ECB(6, 15),
                                               new ECB(2, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(11, intArray(3, 6, 30, 54),
                                  new ECBlocks(20, new ECB(4, 81)),
                                  new ECBlocks(30, new ECB(1, 50),
                                               new ECB(4, 51)),
                                  new ECBlocks(28, new ECB(4, 22),
                                               new ECB(4, 23)),
                                  new ECBlocks(24, new ECB(3, 12),
                                               new ECB(8, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(12, intArray(3, 6, 32, 58),
                                  new ECBlocks(24, new ECB(2, 92),
                                               new ECB(2, 93)),
                                  new ECBlocks(22, new ECB(6, 36),
                                               new ECB(2, 37)),
                                  new ECBlocks(26, new ECB(4, 20),
                                               new ECB(6, 21)),
                                  new ECBlocks(28, new ECB(7, 14),
                                               new ECB(4, 15)))));
  VERSIONS.push_back(Ref<Version>(new Version(13, intArray(3, 6, 34, 62),
                                  new ECBlocks(26, new ECB(4, 107)),
                                  new ECBlocks(22, new ECB(8, 37),
                                               new ECB(1, 38)),
                                  new ECBlocks(24, new ECB(8, 20),
                                               new ECB(4, 21)),
                                  new ECBlocks(22, new ECB(12, 11),
                                               new ECB(4, 12)))));
  VERSIONS.push_back(Ref<Version>(new Version(14, intArray(4, 6, 26, 46, 66),
                                  new ECBlocks(30, new ECB(3, 115),
                                               new ECB(1, 116)),
                                  new ECBlocks(24, new ECB(4, 40),
                                               new ECB(5, 41)),
                                  new ECBlocks(20, new ECB(11, 16),
                                               new ECB(5, 17)),
                                  new ECBlocks(24, new ECB(11, 12),
                                               new ECB(5, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(15, intArray(4, 6, 26, 48, 70),
                                  new ECBlocks(22, new ECB(5, 87),
                                               new ECB(1, 88)),
                                  new ECBlocks(24, new ECB(5, 41),
                                               new ECB(5, 42)),
                                  new ECBlocks(30, new ECB(5, 24),
                                               new ECB(7, 25)),
                                  new ECBlocks(24, new ECB(11, 12),
                                               new ECB(7, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(16, intArray(4, 6, 26, 50, 74),
                                  new ECBlocks(24, new ECB(5, 98),
                                               new ECB(1, 99)),
                                  new ECBlocks(28, new ECB(7, 45),
                                               new ECB(3, 46)),
                                  new ECBlocks(24, new ECB(15, 19),
                                               new ECB(2, 20)),
                                  new ECBlocks(30, new ECB(3, 15),
                                               new ECB(13, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(17, intArray(4, 6, 30, 54, 78),
                                  new ECBlocks(28, new ECB(1, 107),
                                               new ECB(5, 108)),
                                  new ECBlocks(28, new ECB(10, 46),
                                               new ECB(1, 47)),
                                  new ECBlocks(28, new ECB(1, 22),
                                               new ECB(15, 23)),
                                  new ECBlocks(28, new ECB(2, 14),
                                               new ECB(17, 15)))));
  VERSIONS.push_back(Ref<Version>(new Version(18, intArray(4, 6, 30, 56, 82),
                                  new ECBlocks(30, new ECB(5, 120),
                                               new ECB(1, 121)),
                                  new ECBlocks(26, new ECB(9, 43),
                                               new ECB(4, 44)),
                                  new ECBlocks(28, new ECB(17, 22),
                                               new ECB(1, 23)),
                                  new ECBlocks(28, new ECB(2, 14),
                                               new ECB(19, 15)))));
  VERSIONS.push_back(Ref<Version>(new Version(19, intArray(4, 6, 30, 58, 86),
                                  new ECBlocks(28, new ECB(3, 113),
                                               new ECB(4, 114)),
                                  new ECBlocks(26, new ECB(3, 44),
                                               new ECB(11, 45)),
                                  new ECBlocks(26, new ECB(17, 21),
                                               new ECB(4, 22)),
                                  new ECBlocks(26, new ECB(9, 13),
                                               new ECB(16, 14)))));
  VERSIONS.push_back(Ref<Version>(new Version(20, intArray(4, 6, 34, 62, 90),
                                  new ECBlocks(28, new ECB(3, 107),
                                               new ECB(5, 108)),
                                  new ECBlocks(26, new ECB(3, 41),
                                               new ECB(13, 42)),
                                  new ECBlocks(30, new ECB(15, 24),
                                               new ECB(5, 25)),
                                  new ECBlocks(28, new ECB(15, 15),
                                               new ECB(10, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(21, intArray(5, 6, 28, 50, 72, 94),
                                  new ECBlocks(28, new ECB(4, 116),
                                               new ECB(4, 117)),
                                  new ECBlocks(26, new ECB(17, 42)),
                                  new ECBlocks(28, new ECB(17, 22),
                                               new ECB(6, 23)),
                                  new ECBlocks(30, new ECB(19, 16),
                                               new ECB(6, 17)))));
  VERSIONS.push_back(Ref<Version>(new Version(22, intArray(5, 6, 26, 50, 74, 98),
                                  new ECBlocks(28, new ECB(2, 111),
                                               new ECB(7, 112)),
                                  new ECBlocks(28, new ECB(17, 46)),
                                  new ECBlocks(30, new ECB(7, 24),
                                               new ECB(16, 25)),
                                  new ECBlocks(24, new ECB(34, 13)))));
  VERSIONS.push_back(Ref<Version>(new Version(23, intArray(5, 6, 30, 54, 78, 102),
                                  new ECBlocks(30, new ECB(4, 121),
                                               new ECB(5, 122)),
                                  new ECBlocks(28, new ECB(4, 47),
                                               new ECB(14, 48)),
                                  new ECBlocks(30, new ECB(11, 24),
                                               new ECB(14, 25)),
                                  new ECBlocks(30, new ECB(16, 15),
                                               new ECB(14, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(24, intArray(5, 6, 28, 54, 80, 106),
                                  new ECBlocks(30, new ECB(6, 117),
                                               new ECB(4, 118)),
                                  new ECBlocks(28, new ECB(6, 45),
                                               new ECB(14, 46)),
                                  new ECBlocks(30, new ECB(11, 24),
                                               new ECB(16, 25)),
                                  new ECBlocks(30, new ECB(30, 16),
                                               new ECB(2, 17)))));
  VERSIONS.push_back(Ref<Version>(new Version(25, intArray(5, 6, 32, 58, 84, 110),
                                  new ECBlocks(26, new ECB(8, 106),
                                               new ECB(4, 107)),
                                  new ECBlocks(28, new ECB(8, 47),
                                               new ECB(13, 48)),
                                  new ECBlocks(30, new ECB(7, 24),
                                               new ECB(22, 25)),
                                  new ECBlocks(30, new ECB(22, 15),
                                               new ECB(13, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(26, intArray(5, 6, 30, 58, 86, 114),
                                  new ECBlocks(28, new ECB(10, 114),
                                               new ECB(2, 115)),
                                  new ECBlocks(28, new ECB(19, 46),
                                               new ECB(4, 47)),
                                  new ECBlocks(28, new ECB(28, 22),
                                               new ECB(6, 23)),
                                  new ECBlocks(30, new ECB(33, 16),
                                               new ECB(4, 17)))));
  VERSIONS.push_back(Ref<Version>(new Version(27, intArray(5, 6, 34, 62, 90, 118),
                                  new ECBlocks(30, new ECB(8, 122),
                                               new ECB(4, 123)),
                                  new ECBlocks(28, new ECB(22, 45),
                                               new ECB(3, 46)),
                                  new ECBlocks(30, new ECB(8, 23),
                                               new ECB(26, 24)),
                                  new ECBlocks(30, new ECB(12, 15),
                                               new ECB(28, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(28, intArray(6, 6, 26, 50, 74, 98, 122),
                                  new ECBlocks(30, new ECB(3, 117),
                                               new ECB(10, 118)),
                                  new ECBlocks(28, new ECB(3, 45),
                                               new ECB(23, 46)),
                                  new ECBlocks(30, new ECB(4, 24),
                                               new ECB(31, 25)),
                                  new ECBlocks(30, new ECB(11, 15),
                                               new ECB(31, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(29, intArray(6, 6, 30, 54, 78, 102, 126),
                                  new ECBlocks(30, new ECB(7, 116),
                                               new ECB(7, 117)),
                                  new ECBlocks(28, new ECB(21, 45),
                                               new ECB(7, 46)),
                                  new ECBlocks(30, new ECB(1, 23),
                                               new ECB(37, 24)),
                                  new ECBlocks(30, new ECB(19, 15),
                                               new ECB(26, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(30, intArray(6, 6, 26, 52, 78, 104, 130),
                                  new ECBlocks(30, new ECB(5, 115),
                                               new ECB(10, 116)),
                                  new ECBlocks(28, new ECB(19, 47),
                                               new ECB(10, 48)),
                                  new ECBlocks(30, new ECB(15, 24),
                                               new ECB(25, 25)),
                                  new ECBlocks(30, new ECB(23, 15),
                                               new ECB(25, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(31, intArray(6, 6, 30, 56, 82, 108, 134),
                                  new ECBlocks(30, new ECB(13, 115),
                                               new ECB(3, 116)),
                                  new ECBlocks(28, new ECB(2, 46),
                                               new ECB(29, 47)),
                                  new ECBlocks(30, new ECB(42, 24),
                                               new ECB(1, 25)),
                                  new ECBlocks(30, new ECB(23, 15),
                                               new ECB(28, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(32, intArray(6, 6, 34, 60, 86, 112, 138),
                                  new ECBlocks(30, new ECB(17, 115)),
                                  new ECBlocks(28, new ECB(10, 46),
                                               new ECB(23, 47)),
                                  new ECBlocks(30, new ECB(10, 24),
                                               new ECB(35, 25)),
                                  new ECBlocks(30, new ECB(19, 15),
                                               new ECB(35, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(33, intArray(6, 6, 30, 58, 86, 114, 142),
                                  new ECBlocks(30, new ECB(17, 115),
                                               new ECB(1, 116)),
                                  new ECBlocks(28, new ECB(14, 46),
                                               new ECB(21, 47)),
                                  new ECBlocks(30, new ECB(29, 24),
                                               new ECB(19, 25)),
                                  new ECBlocks(30, new ECB(11, 15),
                                               new ECB(46, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(34, intArray(6, 6, 34, 62, 90, 118, 146),
                                  new ECBlocks(30, new ECB(13, 115),
                                               new ECB(6, 116)),
                                  new ECBlocks(28, new ECB(14, 46),
                                               new ECB(23, 47)),
                                  new ECBlocks(30, new ECB(44, 24),
                                               new ECB(7, 25)),
                                  new ECBlocks(30, new ECB(59, 16),
                                               new ECB(1, 17)))));
  VERSIONS.push_back(Ref<Version>(new Version(35, intArray(7, 6, 30, 54, 78,
                                  102, 126, 150),
                                  new ECBlocks(30, new ECB(12, 121),
                                               new ECB(7, 122)),
                                  new ECBlocks(28, new ECB(12, 47),
                                               new ECB(26, 48)),
                                  new ECBlocks(30, new ECB(39, 24),
                                               new ECB(14, 25)),
                                  new ECBlocks(30, new ECB(22, 15),
                                               new ECB(41, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(36, intArray(7, 6, 24, 50, 76,
                                  102, 128, 154),
                                  new ECBlocks(30, new ECB(6, 121),
                                               new ECB(14, 122)),
                                  new ECBlocks(28, new ECB(6, 47),
                                               new ECB(34, 48)),
                                  new ECBlocks(30, new ECB(46, 24),
                                               new ECB(10, 25)),
                                  new ECBlocks(30, new ECB(2, 15),
                                               new ECB(64, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(37, intArray(7, 6, 28, 54, 80,
                                  106, 132, 158),
                                  new ECBlocks(30, new ECB(17, 122),
                                               new ECB(4, 123)),
                                  new ECBlocks(28, new ECB(29, 46),
                                               new ECB(14, 47)),
                                  new ECBlocks(30, new ECB(49, 24),
                                               new ECB(10, 25)),
                                  new ECBlocks(30, new ECB(24, 15),
                                               new ECB(46, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(38, intArray(7, 6, 32, 58, 84,
                                  110, 136, 162),
                                  new ECBlocks(30, new ECB(4, 122),
                                               new ECB(18, 123)),
                                  new ECBlocks(28, new ECB(13, 46),
                                               new ECB(32, 47)),
                                  new ECBlocks(30, new ECB(48, 24),
                                               new ECB(14, 25)),
                                  new ECBlocks(30, new ECB(42, 15),
                                               new ECB(32, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(39, intArray(7, 6, 26, 54, 82,
                                  110, 138, 166),
                                  new ECBlocks(30, new ECB(20, 117),
                                               new ECB(4, 118)),
                                  new ECBlocks(28, new ECB(40, 47),
                                               new ECB(7, 48)),
                                  new ECBlocks(30, new ECB(43, 24),
                                               new ECB(22, 25)),
                                  new ECBlocks(30, new ECB(10, 15),
                                               new ECB(67, 16)))));
  VERSIONS.push_back(Ref<Version>(new Version(40, intArray(7, 6, 30, 58, 86,
                                  114, 142, 170),
                                  new ECBlocks(30, new ECB(19, 118),
                                               new ECB(6, 119)),
                                  new ECBlocks(28, new ECB(18, 47),
                                               new ECB(31, 48)),
                                  new ECBlocks(30, new ECB(34, 24),
                                               new ECB(34, 25)),
                                  new ECBlocks(30, new ECB(20, 15),
                                               new ECB(61, 16)))));
  return VERSIONS.size();
}
}
}

// file: zxing/qrcode/decoder/BitMatrixParser.cpp

/*
 *  BitMatrixParser.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/BitMatrixParser.h>
// #include <zxing/qrcode/decoder/DataMask.h>


namespace zxing {
namespace qrcode {

int BitMatrixParser::copyBit(size_t x, size_t y, int versionBits) {
  return bitMatrix_->get(x, y) ? (versionBits << 1) | 0x1 : versionBits << 1;
}

BitMatrixParser::BitMatrixParser(Ref<BitMatrix> bitMatrix) :
    bitMatrix_(bitMatrix), parsedVersion_(0), parsedFormatInfo_() {
  size_t dimension = bitMatrix->getDimension();
  if ((dimension < 21) || (dimension & 0x03) != 1) {
    throw ReaderException("Dimension must be 1 mod 4 and >= 21");
  }
}

Ref<FormatInformation> BitMatrixParser::readFormatInformation() {
  if (parsedFormatInfo_ != 0) {
    return parsedFormatInfo_;
  }

  // Read top-left format info bits
  int formatInfoBits1 = 0;
  for (int i = 0; i < 6; i++) {
    formatInfoBits1 = copyBit(i, 8, formatInfoBits1);
  }
  // .. and skip a bit in the timing pattern ...
  formatInfoBits1 = copyBit(7, 8, formatInfoBits1);
  formatInfoBits1 = copyBit(8, 8, formatInfoBits1);
  formatInfoBits1 = copyBit(8, 7, formatInfoBits1);
  // .. and skip a bit in the timing pattern ...
  for (int j = 5; j >= 0; j--) {
    formatInfoBits1 = copyBit(8, j, formatInfoBits1);
  }

  // Read the top-right/bottom-left pattern
  int dimension = bitMatrix_->getDimension();
  int formatInfoBits2 = 0;
  int jMin = dimension - 7;
  for (int j = dimension - 1; j >= jMin; j--) {
    formatInfoBits2 = copyBit(8, j, formatInfoBits2);
  }
  for (int i = dimension - 8; i < dimension; i++) {
    formatInfoBits2 = copyBit(i, 8, formatInfoBits2);
  }

  parsedFormatInfo_ = FormatInformation::decodeFormatInformation(formatInfoBits1,formatInfoBits2);
  if (parsedFormatInfo_ != 0) {
    return parsedFormatInfo_;
  }
  throw ReaderException("Could not decode format information");
}

Version *BitMatrixParser::readVersion() {
  if (parsedVersion_ != 0) {
    return parsedVersion_;
  }

  int dimension = bitMatrix_->getDimension();

  int provisionalVersion = (dimension - 17) >> 2;
  if (provisionalVersion <= 6) {
    return Version::getVersionForNumber(provisionalVersion);
  }

  // Read top-right version info: 3 wide by 6 tall
  int versionBits = 0;
  for (int y = 5; y >= 0; y--) {
    int xMin = dimension - 11;
    for (int x = dimension - 9; x >= xMin; x--) {
      versionBits = copyBit(x, y, versionBits);
    }
  }

  parsedVersion_ = Version::decodeVersionInformation(versionBits);
  if (parsedVersion_ != 0 && parsedVersion_->getDimensionForVersion() == dimension) {
    return parsedVersion_;
  }

  // Hmm, failed. Try bottom left: 6 wide by 3 tall
  versionBits = 0;
  for (int x = 5; x >= 0; x--) {
    int yMin = dimension - 11;
    for (int y = dimension - 9; y >= yMin; y--) {
      versionBits = copyBit(x, y, versionBits);
    }
  }

  parsedVersion_ = Version::decodeVersionInformation(versionBits);
  if (parsedVersion_ != 0 && parsedVersion_->getDimensionForVersion() == dimension) {
    return parsedVersion_;
  }
  throw ReaderException("Could not decode version");
}

ArrayRef<unsigned char> BitMatrixParser::readCodewords() {
  Ref<FormatInformation> formatInfo = readFormatInformation();
  Version *version = readVersion();


  //	cerr << *bitMatrix_ << endl;
  //	cerr << bitMatrix_->getDimension() << endl;

  // Get the data mask for the format used in this QR Code. This will exclude
  // some bits from reading as we wind through the bit matrix.
  DataMask &dataMask = DataMask::forReference((int)formatInfo->getDataMask());
  //	cout << (int)formatInfo->getDataMask() << endl;
  int dimension = bitMatrix_->getDimension();
  dataMask.unmaskBitMatrix(*bitMatrix_, dimension);


  //		cerr << *bitMatrix_ << endl;
  //	cerr << version->getTotalCodewords() << endl;

  Ref<BitMatrix> functionPattern = version->buildFunctionPattern();


  //	cout << *functionPattern << endl;

  bool readingUp = true;
  ArrayRef<unsigned char> result(version->getTotalCodewords());
  int resultOffset = 0;
  int currentByte = 0;
  int bitsRead = 0;
  // Read columns in pairs, from right to left
  for (int x = dimension - 1; x > 0; x -= 2) {
    if (x == 6) {
      // Skip whole column with vertical alignment pattern;
      // saves time and makes the other code proceed more cleanly
      x--;
    }
    // Read alternatingly from bottom to top then top to bottom
    for (int counter = 0; counter < dimension; counter++) {
      int y = readingUp ? dimension - 1 - counter : counter;
      for (int col = 0; col < 2; col++) {
        // Ignore bits covered by the function pattern
        if (!functionPattern->get(x - col, y)) {
          // Read a bit
          bitsRead++;
          currentByte <<= 1;
          if (bitMatrix_->get(x - col, y)) {
            currentByte |= 1;
          }
          // If we've made a whole byte, save it off
          if (bitsRead == 8) {
            result[resultOffset++] = (unsigned char)currentByte;
            bitsRead = 0;
            currentByte = 0;
          }
        }
      }
    }
    readingUp = !readingUp; // switch directions
  }

  if (resultOffset != version->getTotalCodewords()) {
    throw ReaderException("Did not read all codewords");
  }
  return result;
}

}
}

// file: zxing/qrcode/decoder/DataBlock.cpp

/*
 *  DataBlock.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 19/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/DataBlock.h>
// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {
namespace qrcode {

using namespace std;

DataBlock::DataBlock(int numDataCodewords, ArrayRef<unsigned char> codewords) :
    numDataCodewords_(numDataCodewords), codewords_(codewords) {
}

int DataBlock::getNumDataCodewords() {
  return numDataCodewords_;
}

ArrayRef<unsigned char> DataBlock::getCodewords() {
  return codewords_;
}


std::vector<Ref<DataBlock> > DataBlock::getDataBlocks(ArrayRef<unsigned char> rawCodewords, Version *version,
    ErrorCorrectionLevel &ecLevel) {


  // Figure out the number and size of data blocks used by this version and
  // error correction level
  ECBlocks &ecBlocks = version->getECBlocksForLevel(ecLevel);


  // First count the total number of data blocks
  int totalBlocks = 0;
  vector<ECB*> ecBlockArray = ecBlocks.getECBlocks();
  for (size_t i = 0; i < ecBlockArray.size(); i++) {
    totalBlocks += ecBlockArray[i]->getCount();
  }

  // Now establish DataBlocks of the appropriate size and number of data codewords
  std::vector<Ref<DataBlock> > result(totalBlocks);
  int numResultBlocks = 0;
  for (size_t j = 0; j < ecBlockArray.size(); j++) {
    ECB *ecBlock = ecBlockArray[j];
    for (int i = 0; i < ecBlock->getCount(); i++) {
      int numDataCodewords = ecBlock->getDataCodewords();
      int numBlockCodewords = ecBlocks.getECCodewords() + numDataCodewords;
      ArrayRef<unsigned char> buffer(numBlockCodewords);
      Ref<DataBlock> blockRef(new DataBlock(numDataCodewords, buffer));
      result[numResultBlocks++] = blockRef;
    }
  }

  // All blocks have the same amount of data, except that the last n
  // (where n may be 0) have 1 more byte. Figure out where these start.
  int shorterBlocksTotalCodewords = result[0]->codewords_.size();
  int longerBlocksStartAt = result.size() - 1;
  while (longerBlocksStartAt >= 0) {
    int numCodewords = result[longerBlocksStartAt]->codewords_.size();
    if (numCodewords == shorterBlocksTotalCodewords) {
      break;
    }
    if (numCodewords != shorterBlocksTotalCodewords + 1) {
      throw IllegalArgumentException("Data block sizes differ by more than 1");
    }
    longerBlocksStartAt--;
  }
  longerBlocksStartAt++;

  int shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.getECCodewords();
  // The last elements of result may be 1 element longer;
  // first fill out as many elements as all of them have
  int rawCodewordsOffset = 0;
  for (int i = 0; i < shorterBlocksNumDataCodewords; i++) {
    for (int j = 0; j < numResultBlocks; j++) {
      result[j]->codewords_[i] = rawCodewords[rawCodewordsOffset++];
    }
  }
  // Fill out the last data block in the longer ones
  for (int j = longerBlocksStartAt; j < numResultBlocks; j++) {
    result[j]->codewords_[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
  }
  // Now add in error correction blocks
  int max = result[0]->codewords_.size();
  for (int i = shorterBlocksNumDataCodewords; i < max; i++) {
    for (int j = 0; j < numResultBlocks; j++) {
      int iOffset = j < longerBlocksStartAt ? i : i + 1;
      result[j]->codewords_[iOffset] = rawCodewords[rawCodewordsOffset++];
    }
  }

  if ((size_t)rawCodewordsOffset != rawCodewords.size()) {
    throw IllegalArgumentException("rawCodewordsOffset != rawCodewords.length");
  }

  return result;
}

}
}

// file: zxing/qrcode/decoder/DataMask.cpp

/*
 *  DataMask.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 19/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/DataMask.h>

// #include <zxing/common/IllegalArgumentException.h>

namespace zxing {
namespace qrcode {

using namespace std;

DataMask::DataMask() {
}

DataMask::~DataMask() {
}

vector<Ref<DataMask> > DataMask::DATA_MASKS;
static int N_DATA_MASKS = DataMask::buildDataMasks();

DataMask &DataMask::forReference(int reference) {
  if (reference < 0 || reference > 7) {
    throw IllegalArgumentException("reference must be between 0 and 7");
  }
  return *DATA_MASKS[reference];
}

void DataMask::unmaskBitMatrix(BitMatrix& bits, size_t dimension) {
  for (size_t y = 0; y < dimension; y++) {
    for (size_t x = 0; x < dimension; x++) {
      // TODO: check why the coordinates have to be swapped
      if (isMasked(y, x)) {
        bits.flip(x, y);
      }
    }
  }
}

/**
 * 000: mask bits for which (x + y) mod 2 == 0
 */
class DataMask000 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    //		return ((x + y) & 0x01) == 0;
    return ((x + y) % 2) == 0;
  }
};

/**
 * 001: mask bits for which x mod 2 == 0
 */
class DataMask001 : public DataMask {
public:
  bool isMasked(size_t x, size_t) {
    //		return (x & 0x01) == 0;
    return (x % 2) == 0;
  }
};

/**
 * 010: mask bits for which y mod 3 == 0
 */
class DataMask010 : public DataMask {
public:
  bool isMasked(size_t, size_t y) {
    return y % 3 == 0;
  }
};

/**
 * 011: mask bits for which (x + y) mod 3 == 0
 */
class DataMask011 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    return (x + y) % 3 == 0;
  }
};

/**
 * 100: mask bits for which (x/2 + y/3) mod 2 == 0
 */
class DataMask100 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    //		return (((x >> 1) + (y / 3)) & 0x01) == 0;
    return (((x >> 1) + (y / 3)) % 2) == 0;
  }
};

/**
 * 101: mask bits for which xy mod 2 + xy mod 3 == 0
 */
class DataMask101 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    size_t temp = x * y;
    //		return (temp & 0x01) + (temp % 3) == 0;
    return (temp % 2) + (temp % 3) == 0;

  }
};

/**
 * 110: mask bits for which (xy mod 2 + xy mod 3) mod 2 == 0
 */
class DataMask110 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    size_t temp = x * y;
    //		return (((temp & 0x01) + (temp % 3)) & 0x01) == 0;
    return (((temp % 2) + (temp % 3)) % 2) == 0;
  }
};

/**
 * 111: mask bits for which ((x+y)mod 2 + xy mod 3) mod 2 == 0
 */
class DataMask111 : public DataMask {
public:
  bool isMasked(size_t x, size_t y) {
    //		return ((((x + y) & 0x01) + ((x * y) % 3)) & 0x01) == 0;
    return ((((x + y) % 2) + ((x * y) % 3)) % 2) == 0;
  }
};

int DataMask::buildDataMasks() {
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask000()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask001()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask010()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask011()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask100()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask101()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask110()));
  DATA_MASKS.push_back(Ref<DataMask> (new DataMask111()));
  return DATA_MASKS.size();
}

}
}

// file: zxing/qrcode/decoder/DecodedBitStreamParser.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  DecodedBitStreamParser.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/DecodedBitStreamParser.h>
// #include <zxing/common/CharacterSetECI.h>
// #include <zxing/FormatException.h>
// #include <zxing/common/StringUtils.h>
// #include <iostream>
#ifndef NO_ICONV
// #include <iconv.h>
#endif

// Required for compatibility. TODO: test on Symbian
#ifdef ZXING_ICONV_CONST
#undef ICONV_CONST
#define ICONV_CONST const
#endif

#ifndef ICONV_CONST
#define ICONV_CONST /**/
#endif

using namespace std;
using namespace zxing;
using namespace zxing::qrcode;
using namespace zxing::common;

const char DecodedBitStreamParser::ALPHANUMERIC_CHARS[] =
{ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B',
  'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', ' ', '$', '%', '*', '+', '-', '.', '/', ':'
};

namespace {int GB2312_SUBSET = 1;}

void DecodedBitStreamParser::append(std::string &result,
                                    string const& in,
                                    const char *src) {
  append(result, (unsigned char const*)in.c_str(), in.length(), src);
}

void DecodedBitStreamParser::append(std::string &result,
                                    const unsigned char *bufIn,
                                    size_t nIn,
                                    const char *src) {
#ifndef NO_ICONV
  if (nIn == 0) {
    return;
  }

  iconv_t cd = iconv_open(StringUtils::UTF8, src);
  if (cd == (iconv_t)-1) {
    result.append((const char *)bufIn, nIn);
    return;
  }

  const int maxOut = 4 * nIn + 1;
  unsigned char* bufOut = new unsigned char[maxOut];

  ICONV_CONST char *fromPtr = (ICONV_CONST char *)bufIn;
  size_t nFrom = nIn;
  char *toPtr = (char *)bufOut;
  size_t nTo = maxOut;

  while (nFrom > 0) {
    size_t oneway = iconv(cd, &fromPtr, &nFrom, &toPtr, &nTo);
    if (oneway == (size_t)(-1)) {
      iconv_close(cd);
      delete[] bufOut;
      throw ReaderException("error converting characters");
    }
  }
  iconv_close(cd);

  int nResult = maxOut - nTo;
  bufOut[nResult] = '\0';
  result.append((const char *)bufOut);
  delete[] bufOut;
#else
  result.append((const char *)bufIn, nIn);
#endif
}

void DecodedBitStreamParser::decodeHanziSegment(Ref<BitSource> bits_,
                                                string& result,
                                                int count) {
    BitSource& bits (*bits_);
    // Don't crash trying to read more bits than we have available.
    if (count * 13 > bits.available()) {
      throw FormatException();
    }

    // Each character will require 2 bytes. Read the characters as 2-byte pairs
    // and decode as GB2312 afterwards
    size_t nBytes = 2 * count;
    unsigned char* buffer = new unsigned char[nBytes];
    int offset = 0;
    while (count > 0) {
      // Each 13 bits encodes a 2-byte character
      int twoBytes = bits.readBits(13);
      int assembledTwoBytes = ((twoBytes / 0x060) << 8) | (twoBytes % 0x060);
      if (assembledTwoBytes < 0x003BF) {
        // In the 0xA1A1 to 0xAAFE range
        assembledTwoBytes += 0x0A1A1;
      } else {
        // In the 0xB0A1 to 0xFAFE range
        assembledTwoBytes += 0x0A6A1;
      }
      buffer[offset] = (unsigned char) ((assembledTwoBytes >> 8) & 0xFF);
      buffer[offset + 1] = (unsigned char) (assembledTwoBytes & 0xFF);
      offset += 2;
      count--;
    }

    try {
      append(result, buffer, nBytes, StringUtils::GB2312);
    } catch (ReaderException const& re) {
      delete [] buffer;
      throw FormatException();
    }

    delete [] buffer;
  }

void DecodedBitStreamParser::decodeKanjiSegment(Ref<BitSource> bits, std::string &result, int count) {
  // Each character will require 2 bytes. Read the characters as 2-byte pairs
  // and decode as Shift_JIS afterwards
  size_t nBytes = 2 * count;
  unsigned char* buffer = new unsigned char[nBytes];
  int offset = 0;
  while (count > 0) {
    // Each 13 bits encodes a 2-byte character

    int twoBytes = bits->readBits(13);
    int assembledTwoBytes = ((twoBytes / 0x0C0) << 8) | (twoBytes % 0x0C0);
    if (assembledTwoBytes < 0x01F00) {
      // In the 0x8140 to 0x9FFC range
      assembledTwoBytes += 0x08140;
    } else {
      // In the 0xE040 to 0xEBBF range
      assembledTwoBytes += 0x0C140;
    }
    buffer[offset] = (unsigned char)(assembledTwoBytes >> 8);
    buffer[offset + 1] = (unsigned char)assembledTwoBytes;
    offset += 2;
    count--;
  }

  append(result, buffer, nBytes, StringUtils::SHIFT_JIS);
  delete[] buffer;
}

void DecodedBitStreamParser::decodeByteSegment(Ref<BitSource> bits_,
                                               string& result,
                                               int count,
                                               CharacterSetECI* currentCharacterSetECI,
                                               ArrayRef< ArrayRef<unsigned char> >& byteSegments,
                                               Hashtable const& hints) {
  int nBytes = count;
  BitSource& bits (*bits_);
  // Don't crash trying to read more bits than we have available.
  if (count << 3 > bits.available()) {
    throw FormatException();
  }

  ArrayRef<unsigned char> bytes_ (count);
  unsigned char* readBytes = &(*bytes_)[0];
  for (int i = 0; i < count; i++) {
    readBytes[i] = (unsigned char) bits.readBits(8);
  }
  string encoding;
  if (currentCharacterSetECI == 0) {
    // The spec isn't clear on this mode; see
    // section 6.4.5: t does not say which encoding to assuming
    // upon decoding. I have seen ISO-8859-1 used as well as
    // Shift_JIS -- without anything like an ECI designator to
    // give a hint.
    encoding = StringUtils::guessEncoding(readBytes, count, hints);
  } else {
    encoding = currentCharacterSetECI->getEncodingName();
  }
  try {
    append(result, readBytes, nBytes, encoding.c_str());
  } catch (ReaderException const& re) {
    throw FormatException();
  }
  byteSegments->values().push_back(bytes_);
}

void DecodedBitStreamParser::decodeNumericSegment(Ref<BitSource> bits, std::string &result, int count) {
  int nBytes = count;
  unsigned char* bytes = new unsigned char[nBytes];
  int i = 0;
  // Read three digits at a time
  while (count >= 3) {
    // Each 10 bits encodes three digits
    if (bits->available() < 10) {
      throw ReaderException("format exception");
    }
    int threeDigitsBits = bits->readBits(10);
    if (threeDigitsBits >= 1000) {
      ostringstream s;
      s << "Illegal value for 3-digit unit: " << threeDigitsBits;
      delete[] bytes;
      throw ReaderException(s.str().c_str());
    }
    bytes[i++] = ALPHANUMERIC_CHARS[threeDigitsBits / 100];
    bytes[i++] = ALPHANUMERIC_CHARS[(threeDigitsBits / 10) % 10];
    bytes[i++] = ALPHANUMERIC_CHARS[threeDigitsBits % 10];
    count -= 3;
  }
  if (count == 2) {
    if (bits->available() < 7) {
      throw ReaderException("format exception");
    }
    // Two digits left over to read, encoded in 7 bits
    int twoDigitsBits = bits->readBits(7);
    if (twoDigitsBits >= 100) {
      ostringstream s;
      s << "Illegal value for 2-digit unit: " << twoDigitsBits;
      delete[] bytes;
      throw ReaderException(s.str().c_str());
    }
    bytes[i++] = ALPHANUMERIC_CHARS[twoDigitsBits / 10];
    bytes[i++] = ALPHANUMERIC_CHARS[twoDigitsBits % 10];
  } else if (count == 1) {
    if (bits->available() < 4) {
      throw ReaderException("format exception");
    }
    // One digit left over to read
    int digitBits = bits->readBits(4);
    if (digitBits >= 10) {
      ostringstream s;
      s << "Illegal value for digit unit: " << digitBits;
      delete[] bytes;
      throw ReaderException(s.str().c_str());
    }
    bytes[i++] = ALPHANUMERIC_CHARS[digitBits];
  }
  append(result, bytes, nBytes, StringUtils::ASCII);
  delete[] bytes;
}

char DecodedBitStreamParser::toAlphaNumericChar(size_t value) {
  if (value >= sizeof(DecodedBitStreamParser::ALPHANUMERIC_CHARS)) {
    throw FormatException();
  }
  return ALPHANUMERIC_CHARS[value];
}

void DecodedBitStreamParser::decodeAlphanumericSegment(Ref<BitSource> bits_,
                                                       string& result,
                                                       int count,
                                                       bool fc1InEffect) {
  BitSource& bits (*bits_);
  ostringstream bytes;
  // Read two characters at a time
  while (count > 1) {
    int nextTwoCharsBits = bits.readBits(11);
    bytes << toAlphaNumericChar(nextTwoCharsBits / 45);
    bytes << toAlphaNumericChar(nextTwoCharsBits % 45);
    count -= 2;
  }
  if (count == 1) {
    // special case: one character left
    bytes << toAlphaNumericChar(bits.readBits(6));
  }
  // See section 6.4.8.1, 6.4.8.2
  string s = bytes.str();
  if (fc1InEffect) {
    // We need to massage the result a bit if in an FNC1 mode:
    ostringstream r;
    for (size_t i = 0; i < s.length(); i++) {
      if (s[i] != '%') {
        r << s[i];
      } else {
        if (i < s.length() - 1 && s[i + 1] == '%') {
          // %% is rendered as %
          r << s[i++];
        } else {
          // In alpha mode, % should be converted to FNC1 separator 0x1D
          r << (char)0x1D;
        }
      }
    }
    s = r.str();
  }
  append(result, s, StringUtils::ASCII);
}

namespace {
  int parseECIValue(BitSource bits) {
    int firstByte = bits.readBits(8);
    if ((firstByte & 0x80) == 0) {
      // just one byte
      return firstByte & 0x7F;
    }
    if ((firstByte & 0xC0) == 0x80) {
      // two bytes
      int secondByte = bits.readBits(8);
      return ((firstByte & 0x3F) << 8) | secondByte;
    }
    if ((firstByte & 0xE0) == 0xC0) {
      // three bytes
      int secondThirdBytes = bits.readBits(16);
      return ((firstByte & 0x1F) << 16) | secondThirdBytes;
    }
    throw IllegalArgumentException("Bad ECI bits starting with byte ");
  }
}

Ref<DecoderResult>
DecodedBitStreamParser::decode(ArrayRef<unsigned char> bytes,
                               Version* version,
                               ErrorCorrectionLevel const& ecLevel,
                               Hashtable const& hints) {
  Ref<BitSource> bits_ (new BitSource(bytes));
  BitSource& bits (*bits_);
  string result;
  CharacterSetECI* currentCharacterSetECI = 0;
  bool fc1InEffect = false;
  ArrayRef< ArrayRef<unsigned char> > byteSegments (size_t(0));
  Mode* mode = 0;
  do {
    // While still another segment to read...
    if (bits.available() < 4) {
      // OK, assume we're done. Really, a TERMINATOR mode should have been recorded here
      mode = &Mode::TERMINATOR;
    } else {
      try {
        mode = &Mode::forBits(bits.readBits(4)); // mode is encoded by 4 bits
      } catch (IllegalArgumentException const& iae) {
        throw iae;
        // throw FormatException.getFormatInstance();
      }
    }
    if (mode != &Mode::TERMINATOR) {
      if ((mode == &Mode::FNC1_FIRST_POSITION) || (mode == &Mode::FNC1_SECOND_POSITION)) {
        // We do little with FNC1 except alter the parsed result a bit according to the spec
        fc1InEffect = true;
      } else if (mode == &Mode::STRUCTURED_APPEND) {
        // not really supported; all we do is ignore it
        // Read next 8 bits (symbol sequence #) and 8 bits (parity data), then continue
        bits.readBits(16);
      } else if (mode == &Mode::ECI) {
        // Count doesn't apply to ECI
        int value = parseECIValue(bits);
        currentCharacterSetECI = CharacterSetECI::getCharacterSetECIByValue(value);
        if (currentCharacterSetECI == 0) {
          throw FormatException();
        }
      } else {
        // First handle Hanzi mode which does not start with character count
        if (mode == &Mode::HANZI) {
          //chinese mode contains a sub set indicator right after mode indicator
          int subset = bits.readBits(4);
          int countHanzi = bits.readBits(mode->getCharacterCountBits(version));
          if (subset == GB2312_SUBSET) {
            decodeHanziSegment(bits_, result, countHanzi);
          }
        } else {
          // "Normal" QR code modes:
          // How many characters will follow, encoded in this mode?
          int count = bits.readBits(mode->getCharacterCountBits(version));
          if (mode == &Mode::NUMERIC) {
            decodeNumericSegment(bits_, result, count);
          } else if (mode == &Mode::ALPHANUMERIC) {
            decodeAlphanumericSegment(bits_, result, count, fc1InEffect);
          } else if (mode == &Mode::BYTE) {
            decodeByteSegment(bits_, result, count, currentCharacterSetECI, byteSegments, hints);
          } else if (mode == &Mode::KANJI) {
            decodeKanjiSegment(bits_, result, count);
          } else {
            throw FormatException();
          }
        }
      }
    }
  } while (mode != &Mode::TERMINATOR);

  return Ref<DecoderResult>(new DecoderResult(bytes, Ref<String>(new String(result)), byteSegments, (string)ecLevel));
}


// file: zxing/qrcode/decoder/Decoder.cpp

/*
 *  Decoder.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 20/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/Decoder.h>
// #include <zxing/qrcode/decoder/BitMatrixParser.h>
// #include <zxing/qrcode/ErrorCorrectionLevel.h>
// #include <zxing/qrcode/Version.h>
// #include <zxing/qrcode/decoder/DataBlock.h>
// #include <zxing/qrcode/decoder/DecodedBitStreamParser.h>
// #include <zxing/ReaderException.h>
// #include <zxing/common/reedsolomon/ReedSolomonException.h>

namespace zxing {
namespace qrcode {

using namespace std;

Decoder::Decoder() :
    rsDecoder_(GF256::QR_CODE_FIELD) {
}

void Decoder::correctErrors(ArrayRef<unsigned char> codewordBytes, int numDataCodewords) {
  int numCodewords = codewordBytes->size();
  ArrayRef<int> codewordInts(numCodewords);
  for (int i = 0; i < numCodewords; i++) {
    codewordInts[i] = codewordBytes[i] & 0xff;
  }
  int numECCodewords = numCodewords - numDataCodewords;

  try {
    rsDecoder_.decode(codewordInts, numECCodewords);
  } catch (ReedSolomonException const& ex) {
    ReaderException rex(ex.what());
    throw rex;
  }

  for (int i = 0; i < numDataCodewords; i++) {
    codewordBytes[i] = (unsigned char)codewordInts[i];
  }
}

Ref<DecoderResult> Decoder::decode(Ref<BitMatrix> bits) {
  // Construct a parser and read version, error-correction level
  BitMatrixParser parser(bits);

  Version *version = parser.readVersion();
  ErrorCorrectionLevel &ecLevel = parser.readFormatInformation()->getErrorCorrectionLevel();


  // Read codewords
  ArrayRef<unsigned char> codewords(parser.readCodewords());


  // Separate into data blocks
  std::vector<Ref<DataBlock> > dataBlocks(DataBlock::getDataBlocks(codewords, version, ecLevel));


  // Count total number of data bytes
  int totalBytes = 0;
  for (size_t i = 0; i < dataBlocks.size(); i++) {
    totalBytes += dataBlocks[i]->getNumDataCodewords();
  }
  ArrayRef<unsigned char> resultBytes(totalBytes);
  int resultOffset = 0;


  // Error-correct and copy data blocks together into a stream of bytes
  for (size_t j = 0; j < dataBlocks.size(); j++) {
    Ref<DataBlock> dataBlock(dataBlocks[j]);
    ArrayRef<unsigned char> codewordBytes = dataBlock->getCodewords();
    int numDataCodewords = dataBlock->getNumDataCodewords();
    correctErrors(codewordBytes, numDataCodewords);
    for (int i = 0; i < numDataCodewords; i++) {
      resultBytes[resultOffset++] = codewordBytes[i];
    }
  }

  return DecodedBitStreamParser::decode(resultBytes,
                                        version,
                                        ecLevel,
                                        DecodedBitStreamParser::Hashtable());
}

}
}

// file: zxing/qrcode/decoder/Mode.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Mode.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 19/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/decoder/Mode.h>
// #include <zxing/common/Counted.h>
// #include <zxing/ReaderException.h>
// #include <zxing/qrcode/Version.h>
// #include <sstream>

using zxing::qrcode::Mode;
using std::ostringstream;

Mode Mode::TERMINATOR(0, 0, 0, 0x00, "TERMINATOR");
Mode Mode::NUMERIC(10, 12, 14, 0x01, "NUMERIC");
Mode Mode::ALPHANUMERIC(9, 11, 13, 0x02, "ALPHANUMERIC");
Mode Mode::STRUCTURED_APPEND(0, 0, 0, 0x03, "STRUCTURED_APPEND");
Mode Mode::BYTE(8, 16, 16, 0x04, "BYTE");
Mode Mode::ECI(0, 0, 0, 0x07, "ECI");
Mode Mode::KANJI(8, 10, 12, 0x08, "KANJI");
Mode Mode::FNC1_FIRST_POSITION(0, 0, 0, 0x05, "FNC1_FIRST_POSITION");
Mode Mode::FNC1_SECOND_POSITION(0, 0, 0, 0x09, "FNC1_SECOND_POSITION");
Mode Mode::HANZI(8, 10, 12, 0x0D, "HANZI");

Mode::Mode(int cbv0_9, int cbv10_26, int cbv27, int bits, char const* name) :
    characterCountBitsForVersions0To9_(cbv0_9), characterCountBitsForVersions10To26_(cbv10_26),
    characterCountBitsForVersions27AndHigher_(cbv27), bits_(bits), name_(name) {
}

Mode& Mode::forBits(int bits) {
    switch (bits) {
    case 0x0:
        return TERMINATOR;
    case 0x1:
        return NUMERIC;
    case 0x2:
        return ALPHANUMERIC;
    case 0x3:
        return STRUCTURED_APPEND;
    case 0x4:
        return BYTE;
    case 0x5:
        return FNC1_FIRST_POSITION;
    case 0x7:
        return ECI;
    case 0x8:
        return KANJI;
    case 0x9:
        return FNC1_SECOND_POSITION;
    case 0xD:
        // 0xD is defined in GBT 18284-2000, may not be supported in foreign country
        return HANZI;
    default:
        ostringstream s;
        s << "Illegal mode bits: " << bits;
        throw ReaderException(s.str().c_str());
    }
}

int Mode::getCharacterCountBits(Version *version) {
  int number = version->getVersionNumber();
  if (number <= 9) {
    return characterCountBitsForVersions0To9_;
  } else if (number <= 26) {
    return characterCountBitsForVersions10To26_;
  } else {
    return characterCountBitsForVersions27AndHigher_;
  }
}

// file: zxing/qrcode/detector/AlignmentPattern.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  AlignmentPattern.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/AlignmentPattern.h>

namespace zxing {
namespace qrcode {

using namespace std;

AlignmentPattern::AlignmentPattern(float posX, float posY, float estimatedModuleSize) :
    ResultPoint(posX,posY), estimatedModuleSize_(estimatedModuleSize) {
}

bool AlignmentPattern::aboutEquals(float moduleSize, float i, float j) const {
  if (abs(i - getY()) <= moduleSize && abs(j - getX()) <= moduleSize) {
    float moduleSizeDiff = abs(moduleSize - estimatedModuleSize_);
    return moduleSizeDiff <= 1.0f || moduleSizeDiff <= estimatedModuleSize_;
  }
  return false;
}

Ref<AlignmentPattern> AlignmentPattern::combineEstimate(float i, float j, float newModuleSize) const {
  float combinedX = (getX() + j) / 2.0f;
  float combinedY = (getY() + i) / 2.0f;
  float combinedModuleSize = (estimatedModuleSize_ + newModuleSize) / 2.0f;
  Ref<AlignmentPattern> result
    (new AlignmentPattern(combinedX, combinedY, combinedModuleSize));
  return result;
}

}
}

// file: zxing/qrcode/detector/AlignmentPatternFinder.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  AlignmentPatternFinder.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 14/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include "AlignmentPatternFinder.h"
// #include <zxing/ReaderException.h>
// #include <zxing/common/BitArray.h>
// #include <vector>
// #include <cmath>
// #include <cstdlib>

namespace zxing {
namespace qrcode {

using namespace std;

float AlignmentPatternFinder::centerFromEnd(vector<int> &stateCount, int end) {
  return (float)(end - stateCount[2]) - stateCount[1] / 2.0f;
}

bool AlignmentPatternFinder::foundPatternCross(vector<int> &stateCount) {
  float maxVariance = moduleSize_ / 2.0f;
  for (size_t i = 0; i < 3; i++) {
    if (abs(moduleSize_ - stateCount[i]) >= maxVariance) {
      return false;
    }
  }
  return true;
}

float AlignmentPatternFinder::crossCheckVertical(size_t startI, size_t centerJ, int maxCount,
    int originalStateCountTotal) {
  int maxI = image_->getHeight();
  vector<int> stateCount(3, 0);


  // Start counting up from center
  int i = startI;
  while (i >= 0 && image_->get(centerJ, i) && stateCount[1] <= maxCount) {
    stateCount[1]++;
    i--;
  }
  // If already too many modules in this state or ran off the edge:
  if (i < 0 || stateCount[1] > maxCount) {
    return NAN;
  }
  while (i >= 0 && !image_->get(centerJ, i) && stateCount[0] <= maxCount) {
    stateCount[0]++;
    i--;
  }
  if (stateCount[0] > maxCount) {
    return NAN;
  }

  // Now also count down from center
  i = startI + 1;
  while (i < maxI && image_->get(centerJ, i) && stateCount[1] <= maxCount) {
    stateCount[1]++;
    i++;
  }
  if (i == maxI || stateCount[1] > maxCount) {
    return NAN;
  }
  while (i < maxI && !image_->get(centerJ, i) && stateCount[2] <= maxCount) {
    stateCount[2]++;
    i++;
  }
  if (stateCount[2] > maxCount) {
    return NAN;
  }

  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
  if (5 * abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
    return NAN;
  }

  return foundPatternCross(stateCount) ? centerFromEnd(stateCount, i) : NAN;
}

Ref<AlignmentPattern> AlignmentPatternFinder::handlePossibleCenter(vector<int> &stateCount, size_t i, size_t j) {
  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
  float centerJ = centerFromEnd(stateCount, j);
  float centerI = crossCheckVertical(i, (int)centerJ, 2 * stateCount[1], stateCountTotal);
  if (!isnan(centerI)) {
    float estimatedModuleSize = (float)(stateCount[0] + stateCount[1] + stateCount[2]) / 3.0f;
    int max = possibleCenters_->size();
    for (int index = 0; index < max; index++) {
      Ref<AlignmentPattern> center((*possibleCenters_)[index]);
      // Look for about the same center and module size:
      if (center->aboutEquals(estimatedModuleSize, centerI, centerJ)) {
        return center->combineEstimate(centerI, centerJ, estimatedModuleSize);
      }
    }
    AlignmentPattern *tmp = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
    // Hadn't found this before; save it
    tmp->retain();
    possibleCenters_->push_back(tmp);
    if (callback_ != 0) {
      callback_->foundPossibleResultPoint(*tmp);
    }
  }
  Ref<AlignmentPattern> result;
  return result;
}

AlignmentPatternFinder::AlignmentPatternFinder(Ref<BitMatrix> image, size_t startX, size_t startY, size_t width,
                                               size_t height, float moduleSize,
                                               Ref<ResultPointCallback>const& callback) :
    image_(image), possibleCenters_(new vector<AlignmentPattern *> ()), startX_(startX), startY_(startY),
    width_(width), height_(height), moduleSize_(moduleSize), callback_(callback) {
}

AlignmentPatternFinder::~AlignmentPatternFinder() {
  for (size_t i = 0; i < possibleCenters_->size(); i++) {
    (*possibleCenters_)[i]->release();
    (*possibleCenters_)[i] = 0;
  }
  delete possibleCenters_;
}

Ref<AlignmentPattern> AlignmentPatternFinder::find() {
  size_t maxJ = startX_ + width_;
  size_t middleI = startY_ + (height_ >> 1);
  //      Ref<BitArray> luminanceRow(new BitArray(width_));
  // We are looking for black/white/black modules in 1:1:1 ratio;
  // this tracks the number of black/white/black modules seen so far
  vector<int> stateCount(3, 0);
  for (size_t iGen = 0; iGen < height_; iGen++) {
    // Search from middle outwards
    size_t i = middleI + ((iGen & 0x01) == 0 ? ((iGen + 1) >> 1) : -((iGen + 1) >> 1));
    //        image_->getBlackRow(i, luminanceRow, startX_, width_);
    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;
    size_t j = startX_;
    // Burn off leading white pixels before anything else; if we start in the middle of
    // a white run, it doesn't make sense to count its length, since we don't know if the
    // white run continued to the left of the start point
    while (j < maxJ && !image_->get(j, i)) {
      j++;
    }
    int currentState = 0;
    while (j < maxJ) {
      if (image_->get(j, i)) {
        // Black pixel
        if (currentState == 1) { // Counting black pixels
          stateCount[currentState]++;
        } else { // Counting white pixels
          if (currentState == 2) { // A winner?
            if (foundPatternCross(stateCount)) { // Yes
              Ref<AlignmentPattern> confirmed(handlePossibleCenter(stateCount, i, j));
              if (confirmed != 0) {
                return confirmed;
              }
            }
            stateCount[0] = stateCount[2];
            stateCount[1] = 1;
            stateCount[2] = 0;
            currentState = 1;
          } else {
            stateCount[++currentState]++;
          }
        }
      } else { // White pixel
        if (currentState == 1) { // Counting black pixels
          currentState++;
        }
        stateCount[currentState]++;
      }
      j++;
    }
    if (foundPatternCross(stateCount)) {
      Ref<AlignmentPattern> confirmed(handlePossibleCenter(stateCount, i, maxJ));
      if (confirmed != 0) {
        return confirmed;
      }
    }

  }

  // Hmm, nothing we saw was observed and confirmed twice. If we had
  // any guess at all, return it.
  if (possibleCenters_->size() > 0) {
    Ref<AlignmentPattern> center((*possibleCenters_)[0]);
    return center;
  }

  throw zxing::ReaderException("Could not find alignment pattern");
}

}
}

// file: zxing/qrcode/detector/Detector.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Detector.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 14/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/Detector.h>
// #include <zxing/qrcode/detector/FinderPatternFinder.h>
// #include <zxing/qrcode/detector/FinderPattern.h>
// #include <zxing/qrcode/detector/AlignmentPattern.h>
// #include <zxing/qrcode/detector/AlignmentPatternFinder.h>
// #include <zxing/qrcode/Version.h>
// #include <zxing/common/GridSampler.h>
// #include <zxing/DecodeHints.h>
// #include <cmath>
// #include <sstream>
// #include <cstdlib>

namespace zxing {
namespace qrcode {

using namespace std;

Detector::Detector(Ref<BitMatrix> image) :
    image_(image) {
}

Ref<BitMatrix> Detector::getImage() {
   return image_;
}

Ref<DetectorResult> Detector::detect(DecodeHints const& hints) {
  callback_ = hints.getResultPointCallback();
  FinderPatternFinder finder(image_, hints.getResultPointCallback());
  Ref<FinderPatternInfo> info(finder.find(hints));
  return processFinderPatternInfo(info);
}

Ref<DetectorResult> Detector::processFinderPatternInfo(Ref<FinderPatternInfo> info){
  Ref<FinderPattern> topLeft(info->getTopLeft());
  Ref<FinderPattern> topRight(info->getTopRight());
  Ref<FinderPattern> bottomLeft(info->getBottomLeft());

  float moduleSize = calculateModuleSize(topLeft, topRight, bottomLeft);
  if (moduleSize < 1.0f) {
    throw zxing::ReaderException("bad module size");
  }
  int dimension = computeDimension(topLeft, topRight, bottomLeft, moduleSize);
  Version *provisionalVersion = Version::getProvisionalVersionForDimension(dimension);
  int modulesBetweenFPCenters = provisionalVersion->getDimensionForVersion() - 7;

  Ref<AlignmentPattern> alignmentPattern;
  // Anything above version 1 has an alignment pattern
  if (provisionalVersion->getAlignmentPatternCenters().size() > 0) {


    // Guess where a "bottom right" finder pattern would have been
    float bottomRightX = topRight->getX() - topLeft->getX() + bottomLeft->getX();
    float bottomRightY = topRight->getY() - topLeft->getY() + bottomLeft->getY();


    // Estimate that alignment pattern is closer by 3 modules
    // from "bottom right" to known top left location
    float correctionToTopLeft = 1.0f - 3.0f / (float)modulesBetweenFPCenters;
    int estAlignmentX = (int)(topLeft->getX() + correctionToTopLeft * (bottomRightX - topLeft->getX()));
    int estAlignmentY = (int)(topLeft->getY() + correctionToTopLeft * (bottomRightY - topLeft->getY()));


    // Kind of arbitrary -- expand search radius before giving up
    for (int i = 4; i <= 16; i <<= 1) {
      try {
        alignmentPattern = findAlignmentInRegion(moduleSize, estAlignmentX, estAlignmentY, (float)i);
        break;
      } catch (zxing::ReaderException const& re) {
        // try next round
      }
    }
    if (alignmentPattern == 0) {
      // Try anyway
    }

  }

  Ref<PerspectiveTransform> transform = createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);
  Ref<BitMatrix> bits(sampleGrid(image_, dimension, transform));
  std::vector<Ref<ResultPoint> > points(alignmentPattern == 0 ? 3 : 4);
  points[0].reset(bottomLeft);
  points[1].reset(topLeft);
  points[2].reset(topRight);
  if (alignmentPattern != 0) {
    points[3].reset(alignmentPattern);
  }

  Ref<DetectorResult> result(new DetectorResult(bits, points, transform));
  return result;
}

Ref<PerspectiveTransform> Detector::createTransform(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref <
    ResultPoint > bottomLeft, Ref<ResultPoint> alignmentPattern, int dimension) {

  float dimMinusThree = (float)dimension - 3.5f;
  float bottomRightX;
  float bottomRightY;
  float sourceBottomRightX;
  float sourceBottomRightY;
  if (alignmentPattern != 0) {
    bottomRightX = alignmentPattern->getX();
    bottomRightY = alignmentPattern->getY();
    sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3.0f;
  } else {
    // Don't have an alignment pattern, just make up the bottom-right point
    bottomRightX = (topRight->getX() - topLeft->getX()) + bottomLeft->getX();
    bottomRightY = (topRight->getY() - topLeft->getY()) + bottomLeft->getY();
    sourceBottomRightX = sourceBottomRightY = dimMinusThree;
  }

  Ref<PerspectiveTransform> transform(PerspectiveTransform::quadrilateralToQuadrilateral(3.5f, 3.5f, dimMinusThree, 3.5f, sourceBottomRightX,
                                      sourceBottomRightY, 3.5f, dimMinusThree, topLeft->getX(), topLeft->getY(), topRight->getX(),
                                      topRight->getY(), bottomRightX, bottomRightY, bottomLeft->getX(), bottomLeft->getY()));

  return transform;
}

Ref<BitMatrix> Detector::sampleGrid(Ref<BitMatrix> image, int dimension, Ref<PerspectiveTransform> transform) {
  GridSampler &sampler = GridSampler::getInstance();
  return sampler.sampleGrid(image, dimension, transform);
}

int Detector::computeDimension(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft,
                               float moduleSize) {
  int tltrCentersDimension = int(FinderPatternFinder::distance(topLeft, topRight) / moduleSize + 0.5f);
  int tlblCentersDimension = int(FinderPatternFinder::distance(topLeft, bottomLeft) / moduleSize + 0.5f);
  int dimension = ((tltrCentersDimension + tlblCentersDimension) >> 1) + 7;
  switch (dimension & 0x03) { // mod 4
  case 0:
    dimension++;
    break;
    // 1? do nothing
  case 2:
    dimension--;
    break;
  case 3:
    ostringstream s;
    s << "Bad dimension: " << dimension;
    throw zxing::ReaderException(s.str().c_str());
  }
  return dimension;
}

float Detector::calculateModuleSize(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft) {
  // Take the average
  return (calculateModuleSizeOneWay(topLeft, topRight) + calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0f;
}

float Detector::calculateModuleSizeOneWay(Ref<ResultPoint> pattern, Ref<ResultPoint> otherPattern) {
  float moduleSizeEst1 = sizeOfBlackWhiteBlackRunBothWays((int)pattern->getX(), (int)pattern->getY(),
                         (int)otherPattern->getX(), (int)otherPattern->getY());
  float moduleSizeEst2 = sizeOfBlackWhiteBlackRunBothWays((int)otherPattern->getX(), (int)otherPattern->getY(),
                         (int)pattern->getX(), (int)pattern->getY());
  if (isnan(moduleSizeEst1)) {
    return moduleSizeEst2;
  }
  if (isnan(moduleSizeEst2)) {
    return moduleSizeEst1;
  }
  // Average them, and divide by 7 since we've counted the width of 3 black modules,
  // and 1 white and 1 black module on either side. Ergo, divide sum by 14.
  return (moduleSizeEst1 + moduleSizeEst2) / 14.0f;
}

float Detector::sizeOfBlackWhiteBlackRunBothWays(int fromX, int fromY, int toX, int toY) {

    float result = sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);

    // Now count other way -- don't run off image though of course
    float scale = 1.0f;
    int otherToX = fromX - (toX - fromX);
    if (otherToX < 0) {
      scale = (float) fromX / (float) (fromX - otherToX);
      otherToX = 0;
    } else if (otherToX >= (int)image_->getWidth()) {
      scale = (float) (image_->getWidth() - 1 - fromX) / (float) (otherToX - fromX);
      otherToX = image_->getWidth() - 1;
    }
    int otherToY = (int) (fromY - (toY - fromY) * scale);

    scale = 1.0f;
    if (otherToY < 0) {
      scale = (float) fromY / (float) (fromY - otherToY);
      otherToY = 0;
    } else if (otherToY >= (int)image_->getHeight()) {
      scale = (float) (image_->getHeight() - 1 - fromY) / (float) (otherToY - fromY);
      otherToY = image_->getHeight() - 1;
    }
    otherToX = (int) (fromX + (otherToX - fromX) * scale);

    result += sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);

    // Middle pixel is double-counted this way; subtract 1
    return result - 1.0f;
}

float Detector::sizeOfBlackWhiteBlackRun(int fromX, int fromY, int toX, int toY) {
    // Mild variant of Bresenham's algorithm;
    // see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
    bool steep = abs(toY - fromY) > abs(toX - fromX);
    if (steep) {
      int temp = fromX;
      fromX = fromY;
      fromY = temp;
      temp = toX;
      toX = toY;
      toY = temp;
    }

    int dx = abs(toX - fromX);
    int dy = abs(toY - fromY);
    int error = -dx >> 1;
    int xstep = fromX < toX ? 1 : -1;
    int ystep = fromY < toY ? 1 : -1;

    // In black pixels, looking for white, first or second time.
    int state = 0;
    // Loop up until x == toX, but not beyond
    int xLimit = toX + xstep;
    for (int x = fromX, y = fromY; x != xLimit; x += xstep) {
      int realX = steep ? y : x;
      int realY = steep ? x : y;

      // Does current pixel mean we have moved white to black or vice versa?
      if (!((state == 1) ^ image_->get(realX, realY))) {
        if (state == 2) {
          int diffX = x - fromX;
          int diffY = y - fromY;
          return (float) sqrt((double) (diffX * diffX + diffY * diffY));
        }
        state++;
      }

      error += dy;
      if (error > 0) {
        if (y == toY) {
          break;
        }
        y += ystep;
        error -= dx;
      }
    }
    // Found black-white-black; give the benefit of the doubt that the next pixel outside the image
    // is "white" so this last point at (toX+xStep,toY) is the right ending. This is really a
    // small approximation; (toX+xStep,toY+yStep) might be really correct. Ignore this.
    if (state == 2) {
      int diffX = toX + xstep - fromX;
      int diffY = toY - fromY;
      return (float) sqrt((double) (diffX * diffX + diffY * diffY));
    }
    // else we didn't find even black-white-black; no estimate is really possible
    return NAN;
}

Ref<AlignmentPattern> Detector::findAlignmentInRegion(float overallEstModuleSize, int estAlignmentX, int estAlignmentY,
    float allowanceFactor) {
  // Look for an alignment pattern (3 modules in size) around where it
  // should be
  int allowance = (int)(allowanceFactor * overallEstModuleSize);
  int alignmentAreaLeftX = max(0, estAlignmentX - allowance);
  int alignmentAreaRightX = min((int)(image_->getWidth() - 1), estAlignmentX + allowance);
  if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3) {
      throw zxing::ReaderException("region too small to hold alignment pattern");
  }
  int alignmentAreaTopY = max(0, estAlignmentY - allowance);
  int alignmentAreaBottomY = min((int)(image_->getHeight() - 1), estAlignmentY + allowance);
  if (alignmentAreaBottomY - alignmentAreaTopY < overallEstModuleSize * 3) {
      throw zxing::ReaderException("region too small to hold alignment pattern");
  }

  AlignmentPatternFinder alignmentFinder(image_, alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX
                                         - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, callback_);
  return alignmentFinder.find();
}

}
}

// file: zxing/qrcode/detector/FinderPattern.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  FinderPattern.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/FinderPattern.h>

namespace zxing {
	namespace qrcode {

		using namespace std;

		FinderPattern::FinderPattern(float posX, float posY, float estimatedModuleSize) :
		ResultPoint(posX,posY), estimatedModuleSize_(estimatedModuleSize), count_(1) {
		}

		FinderPattern::FinderPattern(float posX, float posY, float estimatedModuleSize, int count) :
		ResultPoint(posX,posY), estimatedModuleSize_(estimatedModuleSize), count_(count) {
		}

		int FinderPattern::getCount() const {
			return count_;
		}

		float FinderPattern::getEstimatedModuleSize() const {
			return estimatedModuleSize_;
		}

		void FinderPattern::incrementCount() {
			count_++;
		}

/*
		bool FinderPattern::aboutEquals(float moduleSize, float i, float j) const {
			return abs(i - posY_) <= moduleSize && abs(j - posX_) <= moduleSize && (abs(moduleSize - estimatedModuleSize_)
																					<= 1.0f || abs(moduleSize - estimatedModuleSize_) / estimatedModuleSize_ <= 0.1f);
		}
*/
    bool FinderPattern::aboutEquals(float moduleSize, float i, float j) const {
      if (abs(i - getY()) <= moduleSize && abs(j - getX()) <= moduleSize) {
        float moduleSizeDiff = abs(moduleSize - estimatedModuleSize_);
        return moduleSizeDiff <= 1.0f || moduleSizeDiff <= estimatedModuleSize_;
      }
      return false;
    }

    Ref<FinderPattern> FinderPattern::combineEstimate(float i, float j, float newModuleSize) const {
      int combinedCount = count_ + 1;
      float combinedX = (count_ * getX() + j) / combinedCount;
      float combinedY = (count_ * getY() + i) / combinedCount;
      float combinedModuleSize = (count_ * getEstimatedModuleSize() + newModuleSize) / combinedCount;
      return Ref<FinderPattern>(new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount));
    }
	}
}

// file: zxing/qrcode/detector/FinderPatternFinder.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  FinderPatternFinder.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/FinderPatternFinder.h>
// #include <zxing/ReaderException.h>
// #include <zxing/DecodeHints.h>
// #include <vector>
// #include <cmath>
// #include <cstdlib>
// #include <algorithm>

namespace zxing {
namespace qrcode {

using namespace std;

class FurthestFromAverageComparator {
private:
  const float averageModuleSize_;
public:
  FurthestFromAverageComparator(float averageModuleSize) :
    averageModuleSize_(averageModuleSize) {
  }
  bool operator()(Ref<FinderPattern> a, Ref<FinderPattern> b) {
    float dA = abs(a->getEstimatedModuleSize() - averageModuleSize_);
    float dB = abs(b->getEstimatedModuleSize() - averageModuleSize_);
    return dA > dB;
  }
};

class CenterComparator {
  const float averageModuleSize_;
public:
  CenterComparator(float averageModuleSize) :
    averageModuleSize_(averageModuleSize) {
  }
  bool operator()(Ref<FinderPattern> a, Ref<FinderPattern> b) {
    // N.B.: we want the result in descending order ...
    if (a->getCount() != b->getCount()) {
      return a->getCount() > b->getCount();
    } else {
      float dA = abs(a->getEstimatedModuleSize() - averageModuleSize_);
      float dB = abs(b->getEstimatedModuleSize() - averageModuleSize_);
      return dA < dB;
    }
  }
};

int FinderPatternFinder::CENTER_QUORUM = 2;
int FinderPatternFinder::MIN_SKIP = 3;
int FinderPatternFinder::MAX_MODULES = 57;

float FinderPatternFinder::centerFromEnd(int* stateCount, int end) {
  return (float)(end - stateCount[4] - stateCount[3]) - stateCount[2] / 2.0f;
}

bool FinderPatternFinder::foundPatternCross(int* stateCount) {
  int totalModuleSize = 0;
  for (int i = 0; i < 5; i++) {
    if (stateCount[i] == 0) {
      return false;
    }
    totalModuleSize += stateCount[i];
  }
  if (totalModuleSize < 7) {
    return false;
  }
  float moduleSize = (float)totalModuleSize / 7.0f;
  float maxVariance = moduleSize / 2.0f;
  // Allow less than 50% variance from 1-1-3-1-1 proportions
  return abs(moduleSize - stateCount[0]) < maxVariance && abs(moduleSize - stateCount[1]) < maxVariance && abs(3.0f
         * moduleSize - stateCount[2]) < 3.0f * maxVariance && abs(moduleSize - stateCount[3]) < maxVariance && abs(
           moduleSize - stateCount[4]) < maxVariance;
}

float FinderPatternFinder::crossCheckVertical(size_t startI, size_t centerJ, int maxCount, int originalStateCountTotal) {

  int maxI = image_->getHeight();
  int stateCount[5];
  for (int i = 0; i < 5; i++)
    stateCount[i] = 0;


  // Start counting up from center
  int i = startI;
  while (i >= 0 && image_->get(centerJ, i)) {
    stateCount[2]++;
    i--;
  }
  if (i < 0) {
    return NAN;
  }
  while (i >= 0 && !image_->get(centerJ, i) && stateCount[1] <= maxCount) {
    stateCount[1]++;
    i--;
  }
  // If already too many modules in this state or ran off the edge:
  if (i < 0 || stateCount[1] > maxCount) {
    return NAN;
  }
  while (i >= 0 && image_->get(centerJ, i) && stateCount[0] <= maxCount) {
    stateCount[0]++;
    i--;
  }
  if (stateCount[0] > maxCount) {
    return NAN;
  }

  // Now also count down from center
  i = startI + 1;
  while (i < maxI && image_->get(centerJ, i)) {
    stateCount[2]++;
    i++;
  }
  if (i == maxI) {
    return NAN;
  }
  while (i < maxI && !image_->get(centerJ, i) && stateCount[3] < maxCount) {
    stateCount[3]++;
    i++;
  }
  if (i == maxI || stateCount[3] >= maxCount) {
    return NAN;
  }
  while (i < maxI && image_->get(centerJ, i) && stateCount[4] < maxCount) {
    stateCount[4]++;
    i++;
  }
  if (stateCount[4] >= maxCount) {
    return NAN;
  }

  // If we found a finder-pattern-like section, but its size is more than 40% different than
  // the original, assume it's a false positive
  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  if (5 * abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal) {
    return NAN;
  }

  return foundPatternCross(stateCount) ? centerFromEnd(stateCount, i) : NAN;
}

float FinderPatternFinder::crossCheckHorizontal(size_t startJ, size_t centerI, int maxCount,
    int originalStateCountTotal) {

  int maxJ = image_->getWidth();
  int stateCount[5];
  for (int i = 0; i < 5; i++)
    stateCount[i] = 0;

  int j = startJ;
  while (j >= 0 && image_->get(j, centerI)) {
    stateCount[2]++;
    j--;
  }
  if (j < 0) {
    return NAN;
  }
  while (j >= 0 && !image_->get(j, centerI) && stateCount[1] <= maxCount) {
    stateCount[1]++;
    j--;
  }
  if (j < 0 || stateCount[1] > maxCount) {
    return NAN;
  }
  while (j >= 0 && image_->get(j, centerI) && stateCount[0] <= maxCount) {
    stateCount[0]++;
    j--;
  }
  if (stateCount[0] > maxCount) {
    return NAN;
  }

  j = startJ + 1;
  while (j < maxJ && image_->get(j, centerI)) {
    stateCount[2]++;
    j++;
  }
  if (j == maxJ) {
    return NAN;
  }
  while (j < maxJ && !image_->get(j, centerI) && stateCount[3] < maxCount) {
    stateCount[3]++;
    j++;
  }
  if (j == maxJ || stateCount[3] >= maxCount) {
    return NAN;
  }
  while (j < maxJ && image_->get(j, centerI) && stateCount[4] < maxCount) {
    stateCount[4]++;
    j++;
  }
  if (stateCount[4] >= maxCount) {
    return NAN;
  }

  // If we found a finder-pattern-like section, but its size is significantly different than
  // the original, assume it's a false positive
  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  if (5 * abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal) {
    return NAN;
  }

  return foundPatternCross(stateCount) ? centerFromEnd(stateCount, j) : NAN;
}

bool FinderPatternFinder::handlePossibleCenter(int* stateCount, size_t i, size_t j) {
  int stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
  float centerJ = centerFromEnd(stateCount, j);
  float centerI = crossCheckVertical(i, (size_t)centerJ, stateCount[2], stateCountTotal);
  if (!isnan(centerI)) {
    // Re-cross check
    centerJ = crossCheckHorizontal((size_t)centerJ, (size_t)centerI, stateCount[2], stateCountTotal);
    if (!isnan(centerJ)) {
      float estimatedModuleSize = (float)stateCountTotal / 7.0f;
      bool found = false;
      size_t max = possibleCenters_.size();
      for (size_t index = 0; index < max; index++) {
        Ref<FinderPattern> center = possibleCenters_[index];
        // Look for about the same center and module size:
        if (center->aboutEquals(estimatedModuleSize, centerI, centerJ)) {
          possibleCenters_[index] = center->combineEstimate(centerI, centerJ, estimatedModuleSize);
          found = true;
          break;
        }
      }
      if (!found) {
        Ref<FinderPattern> newPattern(new FinderPattern(centerJ, centerI, estimatedModuleSize));
        possibleCenters_.push_back(newPattern);
        if (callback_ != 0) {
          callback_->foundPossibleResultPoint(*newPattern);
        }
      }
      return true;
    }
  }
  return false;
}

int FinderPatternFinder::findRowSkip() {
  size_t max = possibleCenters_.size();
  if (max <= 1) {
    return 0;
  }
  Ref<FinderPattern> firstConfirmedCenter;
  for (size_t i = 0; i < max; i++) {
    Ref<FinderPattern> center = possibleCenters_[i];
    if (center->getCount() >= CENTER_QUORUM) {
      if (firstConfirmedCenter == 0) {
        firstConfirmedCenter = center;
      } else {
        // We have two confirmed centers
        // How far down can we skip before resuming looking for the next
        // pattern? In the worst case, only the difference between the
        // difference in the x / y coordinates of the two centers.
        // This is the case where you find top left first. Draw it out.
        hasSkipped_ = true;
        return (int)(abs(firstConfirmedCenter->getX() - center->getX()) - abs(firstConfirmedCenter->getY()
                     - center->getY()))/2;
      }
    }
  }
  return 0;
}

bool FinderPatternFinder::haveMultiplyConfirmedCenters() {
  int confirmedCount = 0;
  float totalModuleSize = 0.0f;
  size_t max = possibleCenters_.size();
  for (size_t i = 0; i < max; i++) {
    Ref<FinderPattern> pattern = possibleCenters_[i];
    if (pattern->getCount() >= CENTER_QUORUM) {
      confirmedCount++;
      totalModuleSize += pattern->getEstimatedModuleSize();
    }
  }
  if (confirmedCount < 3) {
    return false;
  }
  // OK, we have at least 3 confirmed centers, but, it's possible that one is a "false positive"
  // and that we need to keep looking. We detect this by asking if the estimated module sizes
  // vary too much. We arbitrarily say that when the total deviation from average exceeds
  // 5% of the total module size estimates, it's too much.
  float average = totalModuleSize / max;
  float totalDeviation = 0.0f;
  for (size_t i = 0; i < max; i++) {
    Ref<FinderPattern> pattern = possibleCenters_[i];
    totalDeviation += abs(pattern->getEstimatedModuleSize() - average);
  }
  return totalDeviation <= 0.05f * totalModuleSize;
}

vector<Ref<FinderPattern> > FinderPatternFinder::selectBestPatterns() {
  size_t startSize = possibleCenters_.size();

  if (startSize < 3) {
    // Couldn't find enough finder patterns
    throw zxing::ReaderException("Could not find three finder patterns");
  }

  // Filter outlier possibilities whose module size is too different
  if (startSize > 3) {
    // But we can only afford to do so if we have at least 4 possibilities to choose from
    float totalModuleSize = 0.0f;
    float square = 0.0f;
    for (size_t i = 0; i < startSize; i++) {
      float size = possibleCenters_[i]->getEstimatedModuleSize();
      totalModuleSize += size;
      square += size * size;
    }
    float average = totalModuleSize / (float) startSize;
    float stdDev = (float)sqrt(square / startSize - average * average);

    sort(possibleCenters_.begin(), possibleCenters_.end(), FurthestFromAverageComparator(average));

    float limit = max(0.2f * average, stdDev);

    for (size_t i = 0; i < possibleCenters_.size() && possibleCenters_.size() > 3; i++) {
      if (abs(possibleCenters_[i]->getEstimatedModuleSize() - average) > limit) {
        possibleCenters_.erase(possibleCenters_.begin()+i);
        i--;
      }
    }
  }

  if (possibleCenters_.size() > 3) {
    // Throw away all but those first size candidate points we found.
    float totalModuleSize = 0.0f;
    for (size_t i = 0; i < possibleCenters_.size(); i++) {
      float size = possibleCenters_[i]->getEstimatedModuleSize();
      totalModuleSize += size;
    }
    float average = totalModuleSize / (float) possibleCenters_.size();
    sort(possibleCenters_.begin(), possibleCenters_.end(), CenterComparator(average));
  }

  if (possibleCenters_.size() > 3) {
    possibleCenters_.erase(possibleCenters_.begin()+3,possibleCenters_.end());
  }

  vector<Ref<FinderPattern> > result(3);
  result[0] = possibleCenters_[0];
  result[1] = possibleCenters_[1];
  result[2] = possibleCenters_[2];
  return result;
}

vector<Ref<FinderPattern> > FinderPatternFinder::orderBestPatterns(vector<Ref<FinderPattern> > patterns) {
  // Find distances between pattern centers
  float abDistance = distance(patterns[0], patterns[1]);
  float bcDistance = distance(patterns[1], patterns[2]);
  float acDistance = distance(patterns[0], patterns[2]);

  Ref<FinderPattern> topLeft;
  Ref<FinderPattern> topRight;
  Ref<FinderPattern> bottomLeft;
  // Assume one closest to other two is top left;
  // topRight and bottomLeft will just be guesses below at first
  if (bcDistance >= abDistance && bcDistance >= acDistance) {
    topLeft = patterns[0];
    topRight = patterns[1];
    bottomLeft = patterns[2];
  } else if (acDistance >= bcDistance && acDistance >= abDistance) {
    topLeft = patterns[1];
    topRight = patterns[0];
    bottomLeft = patterns[2];
  } else {
    topLeft = patterns[2];
    topRight = patterns[0];
    bottomLeft = patterns[1];
  }

  // Use cross product to figure out which of other1/2 is the bottom left
  // pattern. The vector "top-left -> bottom-left" x "top-left -> top-right"
  // should yield a vector with positive z component
  if ((bottomLeft->getY() - topLeft->getY()) * (topRight->getX() - topLeft->getX()) < (bottomLeft->getX()
      - topLeft->getX()) * (topRight->getY() - topLeft->getY())) {
    Ref<FinderPattern> temp = topRight;
    topRight = bottomLeft;
    bottomLeft = temp;
  }

  vector<Ref<FinderPattern> > results(3);
  results[0] = bottomLeft;
  results[1] = topLeft;
  results[2] = topRight;
  return results;
}

float FinderPatternFinder::distance(Ref<ResultPoint> p1, Ref<ResultPoint> p2) {
  float dx = p1->getX() - p2->getX();
  float dy = p1->getY() - p2->getY();
  return (float)sqrt(dx * dx + dy * dy);
}

FinderPatternFinder::FinderPatternFinder(Ref<BitMatrix> image,
                                           Ref<ResultPointCallback>const& callback) :
    image_(image), possibleCenters_(), hasSkipped_(false), callback_(callback) {
}

Ref<FinderPatternInfo> FinderPatternFinder::find(DecodeHints const& hints) {
  bool tryHarder = hints.getTryHarder();

  size_t maxI = image_->getHeight();
  size_t maxJ = image_->getWidth();


  // We are looking for black/white/black/white/black modules in
  // 1:1:3:1:1 ratio; this tracks the number of such modules seen so far

  // As this is used often, we use an integer array instead of vector
  int stateCount[5];
  bool done = false;


  // Let's assume that the maximum version QR Code we support takes up 1/4
  // the height of the image, and then account for the center being 3
  // modules in size. This gives the smallest number of pixels the center
  // could be, so skip this often. When trying harder, look for all
  // QR versions regardless of how dense they are.
  int iSkip = (3 * maxI) / (4 * MAX_MODULES);
  if (iSkip < MIN_SKIP || tryHarder) {
      iSkip = MIN_SKIP;
  }

  // This is slightly faster than using the Ref. Efficiency is important here
  BitMatrix& matrix = *image_;

  for (size_t i = iSkip - 1; i < maxI && !done; i += iSkip) {
    // Get a row of black/white values

    stateCount[0] = 0;
    stateCount[1] = 0;
    stateCount[2] = 0;
    stateCount[3] = 0;
    stateCount[4] = 0;
    int currentState = 0;
    for (size_t j = 0; j < maxJ; j++) {
      if (matrix.get(j, i)) {
        // Black pixel
        if ((currentState & 1) == 1) { // Counting white pixels
          currentState++;
        }
        stateCount[currentState]++;
      } else { // White pixel
        if ((currentState & 1) == 0) { // Counting black pixels
          if (currentState == 4) { // A winner?
            if (foundPatternCross(stateCount)) { // Yes
              bool confirmed = handlePossibleCenter(stateCount, i, j);
              if (confirmed) {
                // Start examining every other line. Checking each line turned out to be too
                // expensive and didn't improve performance.
                iSkip = 2;
                if (hasSkipped_) {
                  done = haveMultiplyConfirmedCenters();
                } else {
                  int rowSkip = findRowSkip();
                  if (rowSkip > stateCount[2]) {
                    // Skip rows between row of lower confirmed center
                    // and top of presumed third confirmed center
                    // but back up a bit to get a full chance of detecting
                    // it, entire width of center of finder pattern

                    // Skip by rowSkip, but back off by stateCount[2] (size
                    // of last center of pattern we saw) to be conservative,
                    // and also back off by iSkip which is about to be
                    // re-added
                    i += rowSkip - stateCount[2] - iSkip;
                    j = maxJ - 1;
                  }
                }
              } else {
                stateCount[0] = stateCount[2];
                stateCount[1] = stateCount[3];
                stateCount[2] = stateCount[4];
                stateCount[3] = 1;
                stateCount[4] = 0;
                currentState = 3;
                continue;
              }
              // Clear state to start looking again
              currentState = 0;
              stateCount[0] = 0;
              stateCount[1] = 0;
              stateCount[2] = 0;
              stateCount[3] = 0;
              stateCount[4] = 0;
            } else { // No, shift counts back by two
              stateCount[0] = stateCount[2];
              stateCount[1] = stateCount[3];
              stateCount[2] = stateCount[4];
              stateCount[3] = 1;
              stateCount[4] = 0;
              currentState = 3;
            }
          } else {
            stateCount[++currentState]++;
          }
        } else { // Counting white pixels
          stateCount[currentState]++;
        }
      }
    }
    if (foundPatternCross(stateCount)) {
      bool confirmed = handlePossibleCenter(stateCount, i, maxJ);
      if (confirmed) {
        iSkip = stateCount[0];
        if (hasSkipped_) {
          // Found a third one
          done = haveMultiplyConfirmedCenters();
        }
      }
    }
  }

  vector<Ref<FinderPattern> > patternInfo = selectBestPatterns();
  patternInfo = orderBestPatterns(patternInfo);

  Ref<FinderPatternInfo> result(new FinderPatternInfo(patternInfo));
  return result;
}
}
}

// file: zxing/qrcode/detector/FinderPatternInfo.cpp

/*
 *  FinderPatternInfo.cpp
 *  zxing
 *
 *  Created by Christian Brunschen on 13/05/2008.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/FinderPatternInfo.h>

namespace zxing {
namespace qrcode {

FinderPatternInfo::FinderPatternInfo(std::vector<Ref<FinderPattern> > patternCenters) :
    bottomLeft_(patternCenters[0]), topLeft_(patternCenters[1]), topRight_(patternCenters[2]) {
}

Ref<FinderPattern> FinderPatternInfo::getBottomLeft() {
  return bottomLeft_;
}
Ref<FinderPattern> FinderPatternInfo::getTopLeft() {
  return topLeft_;
}
Ref<FinderPattern> FinderPatternInfo::getTopRight() {
  return topRight_;
}

}
}

// file: zxing/qrcode/detector/QREdgeDetector.cpp

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
/*
 *  Created by Ralf Kistner on 7/12/2009.
 *  Copyright 2008 ZXing authors All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// #include <zxing/qrcode/detector/QREdgeDetector.h>
// #include <zxing/common/EdgeDetector.h>
// #include <cstdlib>

using namespace std;

namespace zxing {
namespace qrcode {

static const float patternEdgeThreshold = 2;
static const int patternEdgeWidth = 3;
static const float patternEdgeSearchRatio = 1.1;
static const int patternEdgeSkip = 2;

static const float accurateEdgeThreshold = 3.3;
static const int accurateEdgeWidth = 7;
static const int accurateEdgeSkip = 2;

static Point guessLastPattern(Point topLeft, Point topRight, Point bottomLeft) {
  return Point(topRight.x - topLeft.x + bottomLeft.x, topRight.y - topLeft.y + bottomLeft.y);
}

static Point rp(Ref<ResultPoint> rp) {
  return Point(rp->getX(), rp->getY());
}

QREdgeDetector::QREdgeDetector(Ref<BitMatrix> image) : Detector(image) { }

Ref<PerspectiveTransform> QREdgeDetector::createTransform(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref <
      ResultPoint > bottomLeft, Ref<ResultPoint> alignmentPattern, int dimension) {

  if(alignmentPattern == NULL) {
    Point corner = findCorner(*Detector::getImage(), rp(topLeft), rp(topRight), rp(bottomLeft), dimension);
    return get1CornerTransform(rp(topLeft), rp(topRight), rp(bottomLeft), corner, dimension);
  } else {
    return Detector::createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);
  }
}




Point QREdgeDetector::findCorner(const BitMatrix& image, Point topLeft, Point topRight, Point bottomLeft, int dimension) {
  (void)dimension;
  Point bottomRight = guessLastPattern(topLeft, topRight, bottomLeft);

  Line bottomEst = findPatternEdge(image, bottomLeft, topLeft, bottomRight, false);
  Line rightEst = findPatternEdge(image, topRight, topLeft, bottomRight, true);

  //return EdgeDetector::intersection(bottomEst, rightEst);

  Line bottom = EdgeDetector::findLine(image, bottomEst, false, accurateEdgeWidth, accurateEdgeThreshold, accurateEdgeSkip);
  Line right = EdgeDetector::findLine(image, rightEst, true, accurateEdgeWidth, accurateEdgeThreshold, accurateEdgeSkip);


  return EdgeDetector::intersection(bottom, right);
}

Line QREdgeDetector::findPatternEdge(const BitMatrix& image, Point pattern, Point opposite, Point direction, bool invert) {
  Point start = endOfReverseBlackWhiteBlackRun(image, pattern, opposite);

  float dx = pattern.x - start.x;
  float dy = pattern.y - start.y;
  float dist = sqrt(dx*dx + dy*dy);

  float dirX = direction.x - pattern.x;
  float dirY = direction.y - pattern.y;
  float dirSize = sqrt(dirX*dirX + dirY*dirY);

  float nx = dirX/dirSize;
  float ny = dirY/dirSize;

  float search = dist * patternEdgeSearchRatio;
  Point a(start.x + nx*search, start.y + ny*search);
  Point b(start.x - nx*search, start.y - ny*search);

  return EdgeDetector::findLine(image, Line(a, b), invert, patternEdgeWidth, patternEdgeThreshold, patternEdgeSkip);
}


Ref<PerspectiveTransform> QREdgeDetector::get1CornerTransform(Point topLeft, Point topRight, Point bottomLeft, Point corner, int dimension) {
  float dimMinusThree = (float) dimension - 3.5f;

  Ref<PerspectiveTransform> transform(PerspectiveTransform::quadrilateralToQuadrilateral(3.5f, 3.5f, dimMinusThree, 3.5f, dimension,
                                      dimension, 3.5f, dimMinusThree, topLeft.x, topLeft.y, topRight.x,
                                      topRight.y, corner.x, corner.y, bottomLeft.x, bottomLeft.y));

  return transform;
}

// Adapted from "sizeOfBlackWhiteBlackRun" in zxing::qrcode::Detector
Point QREdgeDetector::endOfReverseBlackWhiteBlackRun(const BitMatrix& image, Point from, Point to) {
  int fromX = (int)from.x;
  int fromY = (int)from.y;
  int toX = (int)to.x;
  int toY = (int)to.y;

  bool steep = abs(toY - fromY) > abs(toX - fromX);
  if (steep) {
    int temp = fromX;
    fromX = fromY;
    fromY = temp;
    temp = toX;
    toX = toY;
    toY = temp;
  }

  int dx = abs(toX - fromX);
  int dy = abs(toY - fromY);
  int error = -dx >> 1;
  int ystep = fromY < toY ? -1 : 1;
  int xstep = fromX < toX ? -1 : 1;
  int state = 0; // In black pixels, looking for white, first or second time

  // In case there are no points, prepopulate to from
  int realX = fromX;
  int realY = fromY;
  for (int x = fromX, y = fromY; x != toX; x += xstep) {
    realX = steep ? y : x;
    realY = steep ? x : y;

    if(realX < 0 || realY < 0 || realX >= (int)image.getWidth() || realY >= (int)image.getHeight())
      break;

    if (state == 1) { // In white pixels, looking for black
      if (image.get(realX, realY)) {
        state++;
      }
    } else {
      if (!image.get(realX, realY)) {
        state++;
      }
    }

    if (state == 3) { // Found black, white, black, and stumbled back onto white; done
      return Point(realX, realY);
    }
    error += dy;
    if (error > 0) {
      y += ystep;
      error -= dx;
    }
  }

  // B-W-B run not found, return the last point visited.
  return Point(realX, realY);
}

} // namespace qrcode
} // namespace zxing

