#include <map>
#include <exception>
#include <algorithm>
#include <typeinfo>
#include <string>
#include <limits>
#include <limits.h>
#include <sstream>
#include <cstdarg>
#include <math.h>
#include <vector>
#include <cmath>
#include <string.h>
#include <memory>
#include <cstdlib>
#include <iostream>
#include <stdlib.h>
#include <iconv.h>

// file: zxing/Exception.h

#ifndef __EXCEPTION_H__
// #define __EXCEPTION_H__

/*
 *  Exception.h
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

// #include <string>
// #include <exception>

namespace zxing {

class Exception : public std::exception {
private:
  std::string message;

public:
  Exception();
  Exception(const char *msg);
  virtual const char* what() const throw();
  virtual ~Exception() throw();
};

}
#endif // __EXCEPTION_H__

// file: zxing/common/IllegalArgumentException.h

#ifndef __ILLEGAL_ARGUMENT_EXCEPTION_H__
// #define __ILLEGAL_ARGUMENT_EXCEPTION_H__

/*
 *  IllegalArgumentException.h
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

// #include <zxing/Exception.h>

namespace zxing {
class IllegalArgumentException : public zxing::Exception {
public:
  IllegalArgumentException(const char *msg);
  ~IllegalArgumentException() throw();
};
}

#endif // __ILLEGAL_ARGUMENT_EXCEPTION_H__

// file: zxing/common/Counted.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __COUNTED_H__
// #define __COUNTED_H__

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

//#define DEBUG_COUNTING

// #include <iostream>

#ifdef DEBUG_COUNTING
// #include <typeinfo>
#endif

namespace zxing {

/* base class for reference-counted objects */
class Counted {
private:
  unsigned int count_;
public:
  Counted() :
      count_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating " << typeid(*this).name() << " " << this <<
         " @ " << count_ << "\n";
#endif
  }
  virtual ~Counted() {
  }
  Counted *retain() {
#ifdef DEBUG_COUNTING
    cout << "retaining " << typeid(*this).name() << " " << this <<
         " @ " << count_;
#endif
    count_++;
#ifdef DEBUG_COUNTING
    cout << "->" << count_ << "\n";
#endif
    return this;
  }
  void release() {
#ifdef DEBUG_COUNTING
    cout << "releasing " << typeid(*this).name() << " " << this <<
         " @ " << count_;
#endif
    if (count_ == 0 || count_ == 54321) {
#ifdef DEBUG_COUNTING
      cout << "\nOverreleasing already-deleted object " << this << "!!!\n";
#endif
      throw 4711;
    }
    count_--;
#ifdef DEBUG_COUNTING
    cout << "->" << count_ << "\n";
#endif
    if (count_ == 0) {
#ifdef DEBUG_COUNTING
      cout << "deleting " << typeid(*this).name() << " " << this << "\n";
#endif
      count_ = 0xDEADF001;
      delete this;
    }
  }


  /* return the current count for denugging purposes or similar */
  int count() const {
    return count_;
  }
};

/* counting reference to reference-counted objects */
template<typename T> class Ref {
private:
public:
  T *object_;
  explicit Ref(T *o = 0) :
      object_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating Ref " << this << " from pointer" << o << "\n";
#endif
    reset(o);
  }

  explicit Ref(const T &o) :
      object_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating Ref " << this << " from reference\n";
#endif
    reset(const_cast<T *>(&o));
  }

  Ref(const Ref &other) :
      object_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating Ref " << this << " from Ref " << &other << "\n";
#endif
    reset(other.object_);
  }

  template<class Y>
  Ref(const Ref<Y> &other) :
      object_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating Ref " << this << " from reference\n";
#endif
    reset(other.object_);
  }

  ~Ref() {
#ifdef DEBUG_COUNTING
    cout << "destroying Ref " << this << " with " <<
         (object_ ? typeid(*object_).name() : "NULL") << " " << object_ << "\n";
#endif
    if (object_) {
      object_->release();
    }
  }

  void reset(T *o) {
#ifdef DEBUG_COUNTING
    cout << "resetting Ref " << this << " from " <<
         (object_ ? typeid(*object_).name() : "NULL") << " " << object_ <<
         " to " << (o ? typeid(*o).name() : "NULL") << " " << o << "\n";
#endif
    if (o) {
      o->retain();
    }
    if (object_ != 0) {
      object_->release();
    }
    object_ = o;
  }
  Ref& operator=(const Ref &other) {
    reset(other.object_);
    return *this;
  }
  template<class Y>
  Ref& operator=(const Ref<Y> &other) {
    reset(other.object_);
    return *this;
  }
  Ref& operator=(T* o) {
    reset(o);
    return *this;
  }
  template<class Y>
  Ref& operator=(Y* o) {
    reset(o);
    return *this;
  }

  T& operator*() {
    return *object_;
  }
  T* operator->() const {
    return object_;
  }
  operator T*() const {
    return object_;
  }

  bool operator==(const T* that) {
    return object_ == that;
  }
  bool operator==(const Ref &other) const {
    return object_ == other.object_ || *object_ == *(other.object_);
  }
  template<class Y>
  bool operator==(const Ref<Y> &other) const {
    return object_ == other.object_ || *object_ == *(other.object_);
  }

  bool operator!=(const T* that) {
    return !(*this == that);
  }

  bool empty() const {
    return object_ == 0;
  }

  template<class Y>
  friend std::ostream& operator<<(std::ostream &out, Ref<Y>& ref);
};
}

#endif // __COUNTED_H__

// file: zxing/common/BitArray.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __BIT_ARRAY_H__
// #define __BIT_ARRAY_H__

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

// #include <zxing/common/Counted.h>
// #include <zxing/common/IllegalArgumentException.h>
// #include <vector>
// #include <limits>

namespace zxing {

#define ZX_LOG_DIGITS(digits) \
    ((digits == 8) ? 3 : \
     ((digits == 16) ? 4 : \
      ((digits == 32) ? 5 : \
       ((digits == 64) ? 6 : \
        ((digits == 128) ? 7 : \
         (-1))))))

class BitArray : public Counted {
private:
  size_t size_;
  std::vector<unsigned int> bits_;
  static const unsigned int bitsPerWord_ =
    std::numeric_limits<unsigned int>::digits;
  static const unsigned int logBits_ = ZX_LOG_DIGITS(bitsPerWord_);
  static const unsigned int bitsMask_ = (1 << logBits_) - 1;
  static size_t wordsForBits(size_t bits);
  explicit BitArray();

public:
  BitArray(size_t size);
  ~BitArray();
  size_t getSize();

  bool get(size_t i) {
    return (bits_[i >> logBits_] & (1 << (i & bitsMask_))) != 0;
  }

  void set(size_t i) {
    bits_[i >> logBits_] |= 1 << (i & bitsMask_);
  }

  void setBulk(size_t i, unsigned int newBits);
  void setRange(int start, int end);
  void clear();
  bool isRange(size_t start, size_t end, bool value);
  std::vector<unsigned int>& getBitArray();
  void reverse();
};

}

#endif // __BIT_ARRAY_H__

// file: zxing/common/BitMatrix.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __BIT_MATRIX_H__
// #define __BIT_MATRIX_H__

/*
 *  BitMatrix.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/BitArray.h>
// #include <limits>

namespace zxing {

class BitMatrix : public Counted {
private:
  size_t width_;
  size_t height_;
  size_t words_;
  unsigned int* bits_;

#define ZX_LOG_DIGITS(digits) \
    ((digits == 8) ? 3 : \
     ((digits == 16) ? 4 : \
      ((digits == 32) ? 5 : \
       ((digits == 64) ? 6 : \
        ((digits == 128) ? 7 : \
         (-1))))))

  static const unsigned int bitsPerWord =
    std::numeric_limits<unsigned int>::digits;
  static const unsigned int logBits = ZX_LOG_DIGITS(bitsPerWord);
  static const unsigned int bitsMask = (1 << logBits) - 1;

public:
  BitMatrix(size_t dimension);
  BitMatrix(size_t width, size_t height);

  ~BitMatrix();

  bool get(size_t x, size_t y) const {
    size_t offset = x + width_ * y;
    return ((bits_[offset >> logBits] >> (offset & bitsMask)) & 0x01) != 0;
  }

  void set(size_t x, size_t y) {
    size_t offset = x + width_ * y;
    bits_[offset >> logBits] |= 1 << (offset & bitsMask);
  }

  void flip(size_t x, size_t y);
  void clear();
  void setRegion(size_t left, size_t top, size_t width, size_t height);
  Ref<BitArray> getRow(int y, Ref<BitArray> row);

  size_t getDimension() const;
  size_t getWidth() const;
  size_t getHeight() const;

  unsigned int* getBits() const;

  friend std::ostream& operator<<(std::ostream &out, const BitMatrix &bm);
  const char *description();

private:
  BitMatrix(const BitMatrix&);
  BitMatrix& operator =(const BitMatrix&);
};

}

#endif // __BIT_MATRIX_H__

// file: zxing/common/Array.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __ARRAY_H__
// #define __ARRAY_H__

/*
 *  Array.h
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

// #include <vector>

#ifdef DEBUG_COUNTING
// #include <iostream>
// #include <typeinfo>
#endif

// #include <zxing/common/Counted.h>


namespace zxing {

template<typename T> class Array : public Counted {
protected:
public:
  std::vector<T> values_;
  Array(size_t n) :
      Counted(), values_(n, T()) {
  }
  Array(T *ts, size_t n) :
      Counted(), values_(ts, ts+n) {
  }
  Array(T v, size_t n) :
      Counted(), values_(n, v) {
  }
  Array(std::vector<T> &v) :
      Counted(), values_(v) {
  }
  Array(Array<T> &other) :
      Counted(), values_(other.values_) {
  }
  Array(Array<T> *other) :
      Counted(), values_(other->values_) {
  }
  virtual ~Array() {
  }
  Array<T>& operator=(const Array<T> &other) {
#ifdef DEBUG_COUNTING
    cout << "assigning values from Array " << &other << " to this Array " << this << ", ";
#endif
    values_ = other.values_;
#ifdef DEBUG_COUNTING
    cout << "new size = " << values_.size() << "\n";
#endif
    return *this;
  }
  Array<T>& operator=(const std::vector<T> &array) {
#ifdef DEBUG_COUNTING
    cout << "assigning values from Array " << &array << " to this Array " << this << ", ";
#endif
    values_ = array;
#ifdef DEBUG_COUNTING
    cout << "new size = " << values_.size() << "\n";
#endif
    return *this;
  }
  T operator[](size_t i) const {
    return values_[i];
  }
  T& operator[](size_t i) {
    return values_[i];
  }
  size_t size() const {
    return values_.size();
  }
  std::vector<T> values() const {
    return values_;
  }
  std::vector<T>& values() {
    return values_;
  }
};

template<typename T> class ArrayRef : public Counted {
private:
public:
  Array<T> *array_;
  ArrayRef() :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating empty ArrayRef " << this << "\n";
#endif
  }
  ArrayRef(size_t n) :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << "with size " << n << "\n";
#endif
    reset(new Array<T> (n));
  }
  ArrayRef(T *ts, size_t n) :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << "with " << n << " elements at " << (void *)ts << "\n";
#endif
    reset(new Array<T> (ts, n));
  }
  ArrayRef(Array<T> *a) :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << " from pointer:\n";
#endif
    reset(a);
  }
  ArrayRef(const Array<T> &a) :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << " from reference to Array " << (void *)&a << ":\n";
#endif
    reset(const_cast<Array<T> *>(&a));
  }
  ArrayRef(const ArrayRef &other) :
      Counted(), array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << " from ArrayRef " << &other << ":\n";
#endif
    reset(other.array_);
  }

  template<class Y>
  ArrayRef(const ArrayRef<Y> &other) :
      array_(0) {
#ifdef DEBUG_COUNTING
    cout << "instantiating ArrayRef " << this << " from ArrayRef " << &other << ":\n";
#endif
    reset(static_cast<const Array<T> *>(other.array_));
  }

  ~ArrayRef() {
#ifdef DEBUG_COUNTING
    cout << "destroying ArrayRef " << this << " with " << (array_ ? typeid(*array_).name() : "NULL") << " "
         << array_ << "\n";
#endif
    if (array_) {
      array_->release();
    }
    array_ = 0;
  }

  T operator[](size_t i) const {
    return (*array_)[i];
  }
  T& operator[](size_t i) {
    return (*array_)[i];
  }
  size_t size() const {
    return array_->size();
  }

  void reset(Array<T> *a) {
#ifdef DEBUG_COUNTING
    cout << "resetting ArrayRef " << this << " from " << (array_ ? typeid(*array_).name() : "NULL") << " "
         << array_ << " to " << (a ? typeid(*a).name() : "NULL") << " " << a << "\n";
#endif
    if (a) {
      a->retain();
    }
    if (array_) {
      array_->release();
    }
    array_ = a;
  }
  void reset(const ArrayRef<T> &other) {
    reset(other.array_);
  }
  ArrayRef<T>& operator=(const ArrayRef<T> &other) {
    reset(other);
    return *this;
  }
  ArrayRef<T>& operator=(Array<T> *a) {
    reset(a);
    return *this;
  }

  Array<T>& operator*() {
    return *array_;
  }
  Array<T>* operator->() {
    return array_;
  }
};

} // namespace zxing

#endif // __ARRAY_H__

// file: zxing/common/Str.h

#ifndef __STR_H__
// #define __STR_H__

/*
 *  Str.h
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

// #include <string>
// #include <iostream>
// #include <zxing/common/Counted.h>

namespace zxing {

class String : public Counted {
private:
  std::string text_;
public:
  String(const std::string &text);
  const std::string &getText() const;
  friend std::ostream &operator<<(std::ostream &out, const String &s);
};

}

#endif // __COMMON__STRING_H__

// file: zxing/common/BitSource.h

#ifndef __BIT_SOURCE_H__
// #define __BIT_SOURCE_H__

/*
 *  BitSource.h
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

// #include <zxing/common/Array.h>

namespace zxing {
/**
 * <p>This provides an easy abstraction to read bits at a time from a sequence of bytes, where the
 * number of bits read is not often a multiple of 8.</p>
 *
 * <p>This class is not thread-safe.</p>
 *
 * @author srowen@google.com (Sean Owen)
 * @author christian.brunschen@gmail.com (Christian Brunschen)
 */
class BitSource : public Counted {
  typedef unsigned char byte;
private:
  ArrayRef<byte> bytes_;
  int byteOffset_;
  int bitOffset_;
public:
  /**
   * @param bytes bytes from which this will read bits. Bits will be read from the first byte first.
   * Bits are read within a byte from most-significant to least-significant bit.
   */
  BitSource(ArrayRef<byte> &bytes) :
      bytes_(bytes), byteOffset_(0), bitOffset_(0) {
  }

  int getByteOffset() {
    return byteOffset_;
  }

  /**
   * @param numBits number of bits to read
   * @return int representing the bits read. The bits will appear as the least-significant
   *         bits of the int
   * @throws IllegalArgumentException if numBits isn't in [1,32]
   */
  int readBits(int numBits);

  /**
   * @return number of bits that can be read successfully
   */
  int available();
};

}

#endif // __BIT_SOURCE_H__

// file: zxing/common/DecoderResult.h

#ifndef __DECODER_RESULT_H__
// #define __DECODER_RESULT_H__

/*
 *  DecoderResult.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <string>
// #include <zxing/common/Str.h>

namespace zxing {

class DecoderResult : public Counted {
private:
  ArrayRef<unsigned char> rawBytes_;
  Ref<String> text_;
  ArrayRef< ArrayRef<unsigned char> > byteSegments_;
  std::string ecLevel_;

public:
  DecoderResult(ArrayRef<unsigned char> rawBytes,
                Ref<String> text,
                ArrayRef< ArrayRef<unsigned char> >& byteSegments,
                std::string const& ecLevel);

  DecoderResult(ArrayRef<unsigned char> rawBytes, Ref<String> text);

  ArrayRef<unsigned char> getRawBytes();
  Ref<String> getText();
};

}

#endif // __DECODER_RESULT_H__

// file: zxing/common/PerspectiveTransform.h

#ifndef __PERSPECTIVE_TANSFORM_H__
// #define __PERSPECTIVE_TANSFORM_H__

/*
 *  PerspectiveTransform.h
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

// #include <zxing/common/Counted.h>
// #include <vector>

namespace zxing {
class PerspectiveTransform : public Counted {
private:
  float a11, a12, a13, a21, a22, a23, a31, a32, a33;
  PerspectiveTransform(float a11, float a21, float a31, float a12, float a22, float a32, float a13, float a23,
                       float a33);

public:
  static Ref<PerspectiveTransform>
  quadrilateralToQuadrilateral(float x0, float y0, float x1, float y1, float x2, float y2, float x3, float y3,
                               float x0p, float y0p, float x1p, float y1p, float x2p, float y2p, float x3p, float y3p);
  static Ref<PerspectiveTransform> squareToQuadrilateral(float x0, float y0, float x1, float y1, float x2, float y2,
      float x3, float y3);
  static Ref<PerspectiveTransform> quadrilateralToSquare(float x0, float y0, float x1, float y1, float x2, float y2,
      float x3, float y3);
  Ref<PerspectiveTransform> buildAdjoint();
  Ref<PerspectiveTransform> times(Ref<PerspectiveTransform> other);
  void transformPoints(std::vector<float> &points);

  friend std::ostream& operator<<(std::ostream& out, const PerspectiveTransform &pt);
};
}

#endif // __PERSPECTIVE_TANSFORM_H__

// file: zxing/ResultPoint.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __RESULT_POINT_H__
// #define __RESULT_POINT_H__

/*
 *  ResultPoint.h
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

// #include <zxing/common/Counted.h>
// #include <vector>

namespace zxing {

class ResultPoint : public Counted {
protected:
  float posX_;
  float posY_;

public:
  ResultPoint();
  ResultPoint(float x, float y);
  virtual ~ResultPoint();

  virtual float getX() const;
  virtual float getY() const;

  bool equals(Ref<ResultPoint> other);

  static void orderBestPatterns(std::vector<Ref<ResultPoint> > &patterns);
  static float distance(Ref<ResultPoint> point1, Ref<ResultPoint> point2);
  static float distance(float x1, float x2, float y1, float y2);

private:
  static float crossProductZ(Ref<ResultPoint> pointA, Ref<ResultPoint> pointB, Ref<ResultPoint> pointC);
};

}

#endif // __RESULT_POINT_H__

// file: zxing/common/DetectorResult.h

#ifndef __DETECTOR_RESULT_H__
// #define __DETECTOR_RESULT_H__

/*
 *  DetectorResult.h
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

// #include <vector>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/ResultPoint.h>
// #include <zxing/common/PerspectiveTransform.h>

namespace zxing {

class DetectorResult : public Counted {
private:
  Ref<BitMatrix> bits_;
  std::vector<Ref<ResultPoint> > points_;
  Ref<PerspectiveTransform> transform_;

public:
  DetectorResult(Ref<BitMatrix> bits, std::vector<Ref<ResultPoint> > points, Ref<PerspectiveTransform> transform);
  Ref<BitMatrix> getBits();
  std::vector<Ref<ResultPoint> > getPoints();
  Ref<PerspectiveTransform> getTransform();
};
}

#endif // __DETECTOR_RESULT_H__

// file: zxing/common/Point.h

#ifndef __POINT_H__
// #define __POINT_H__

/*
 *  Point.h
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

namespace zxing {
class PointI {
public:
  int x;
  int y;
};

class Point {
public:
  Point() : x(0.0f), y(0.0f) {};
  Point(float x_, float y_) : x(x_), y(y_) {};

  float x;
  float y;
};

class Line {
public:
  Line(Point start_, Point end_) : start(start_), end(end_) {};

  Point start;
  Point end;
};
}
#endif // POINT_H_

// file: zxing/common/EdgeDetector.h

#ifndef __EDGEDETECTOR_H__
// #define __EDGEDETECTOR_H__
/*
 *  EdgeDetector.h
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



// #include <vector>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Point.h>

namespace zxing {
namespace EdgeDetector {

void findEdgePoints(std::vector<Point>& points, const BitMatrix& image, Point start, Point end, bool invert, int skip, float deviation);
Line findLine(const BitMatrix& image, Line estimate, bool invert, int deviation, float threshold, int skip);

Point intersection(Line a, Line b);

}
}
#endif /* EDGEDETECTOR_H_ */

// file: zxing/LuminanceSource.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __LUMINANCESOURCE_H__
// #define __LUMINANCESOURCE_H__
/*
 *  LuminanceSource.h
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

// #include <zxing/common/Counted.h>
// #include <string.h>

namespace zxing {

class LuminanceSource : public Counted {
public:
  LuminanceSource();
  virtual ~LuminanceSource();

  virtual int getWidth() const = 0;
  virtual int getHeight() const = 0;

  // Callers take ownership of the returned memory and must call delete [] on it themselves.
  virtual unsigned char* getRow(int y, unsigned char* row) = 0;
  virtual unsigned char* getMatrix() = 0;

  virtual bool isCropSupported() const;
  virtual Ref<LuminanceSource> crop(int left, int top, int width, int height);

  virtual bool isRotateSupported() const;
  virtual Ref<LuminanceSource> rotateCounterClockwise();

  operator std::string (); // should be const but don't want to make sure a
                           // large breaking change right now
};

}

#endif /* LUMINANCESOURCE_H_ */

// file: zxing/Binarizer.h

#ifndef BINARIZER_H_
#define BINARIZER_H_

/*
 *  Binarizer.h
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

// #include <zxing/LuminanceSource.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>

namespace zxing {

class Binarizer : public Counted {
 private:
  Ref<LuminanceSource> source_;

 public:
  Binarizer(Ref<LuminanceSource> source);
  virtual ~Binarizer();

  virtual Ref<BitArray> getBlackRow(int y, Ref<BitArray> row) = 0;
  virtual Ref<BitMatrix> getBlackMatrix() = 0;

  Ref<LuminanceSource> getLuminanceSource() const ;
  virtual Ref<Binarizer> createBinarizer(Ref<LuminanceSource> source) = 0;
};

}
#endif /* BINARIZER_H_ */

// file: zxing/common/GlobalHistogramBinarizer.h

#ifndef __GLOBALHISTOGRAMBINARIZER_H__
// #define __GLOBALHISTOGRAMBINARIZER_H__
/*
 *  GlobalHistogramBinarizer.h
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

// #include <vector>
// #include <zxing/Binarizer.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/common/BitMatrix.h>

namespace zxing {

	class GlobalHistogramBinarizer : public Binarizer {
	 private:
    Ref<BitMatrix> cached_matrix_;
	  Ref<BitArray> cached_row_;
	  int cached_row_num_;

	public:
		GlobalHistogramBinarizer(Ref<LuminanceSource> source);
		virtual ~GlobalHistogramBinarizer();

		virtual Ref<BitArray> getBlackRow(int y, Ref<BitArray> row);
		virtual Ref<BitMatrix> getBlackMatrix();
		static int estimate(std::vector<int> &histogram);
		Ref<Binarizer> createBinarizer(Ref<LuminanceSource> source);
	};

}

#endif /* GLOBALHISTOGRAMBINARIZER_H_ */

// file: zxing/common/GreyscaleLuminanceSource.h

#ifndef __GREYSCALE_LUMINANCE_SOURCE__
#define __GREYSCALE_LUMINANCE_SOURCE__
/*
 *  GreyscaleLuminanceSource.h
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

// #include <zxing/LuminanceSource.h>

namespace zxing {

class GreyscaleLuminanceSource : public LuminanceSource {

 private:
  unsigned char* greyData_;
  int dataWidth_;
  int dataHeight_;
  int left_;
  int top_;
  int width_;
  int height_;

 public:
  GreyscaleLuminanceSource(unsigned char* greyData, int dataWidth, int dataHeight, int left,
      int top, int width, int height);

  unsigned char* getRow(int y, unsigned char* row);
  unsigned char* getMatrix();

  bool isRotateSupported() const {
    return true;
  }

  int getWidth() const {
    return width_;
  }

  int getHeight() const {
    return height_;
  }

  Ref<LuminanceSource> rotateCounterClockwise();

};

} /* namespace */

#endif

// file: zxing/common/GreyscaleRotatedLuminanceSource.h

#ifndef __GREYSCALE_ROTATED_LUMINANCE_SOURCE__
#define __GREYSCALE_ROTATED_LUMINANCE_SOURCE__
/*
 *  GreyscaleRotatedLuminanceSource.h
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


// #include <zxing/LuminanceSource.h>

namespace zxing {

class GreyscaleRotatedLuminanceSource : public LuminanceSource {
 private:
  unsigned char* greyData_;
  int dataWidth_;
  int dataHeight_;
  int left_;
  int top_;
  int width_;
  int height_;

public:
  GreyscaleRotatedLuminanceSource(unsigned char* greyData, int dataWidth, int dataHeight,
      int left, int top, int width, int height);

  unsigned char* getRow(int y, unsigned char* row);
  unsigned char* getMatrix();

  bool isRotateSupported() const {
    return false;
  }

  int getWidth() const {
    return width_;
  }

  int getHeight() const {
    return height_;
  }

};

} /* namespace */

#endif

// file: zxing/common/GridSampler.h

#ifndef __GRID_SAMPLER_H__
// #define __GRID_SAMPLER_H__

/*
 *  GridSampler.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/PerspectiveTransform.h>

namespace zxing {
class GridSampler {
private:
  static GridSampler gridSampler;
  GridSampler();

public:
  Ref<BitMatrix> sampleGrid(Ref<BitMatrix> image, int dimension, Ref<PerspectiveTransform> transform);
  Ref<BitMatrix> sampleGrid(Ref<BitMatrix> image, int dimensionX, int dimensionY, Ref<PerspectiveTransform> transform);

  Ref<BitMatrix> sampleGrid(Ref<BitMatrix> image, int dimension, float p1ToX, float p1ToY, float p2ToX, float p2ToY,
                            float p3ToX, float p3ToY, float p4ToX, float p4ToY, float p1FromX, float p1FromY, float p2FromX,
                            float p2FromY, float p3FromX, float p3FromY, float p4FromX, float p4FromY);
  static void checkAndNudgePoints(Ref<BitMatrix> image, std::vector<float> &points);
  static GridSampler &getInstance();
};
}

#endif // __GRID_SAMPLER_H__

// file: zxing/common/HybridBinarizer.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __HYBRIDBINARIZER_H__
// #define __HYBRIDBINARIZER_H__
/*
 *  HybridBinarizer.h
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

// #include <vector>
// #include <zxing/Binarizer.h>
// #include <zxing/common/GlobalHistogramBinarizer.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/common/BitMatrix.h>

namespace zxing {

	class HybridBinarizer : public GlobalHistogramBinarizer {
	 private:
    Ref<BitMatrix> matrix_;
	  Ref<BitArray> cached_row_;
	  int cached_row_num_;

	public:
		HybridBinarizer(Ref<LuminanceSource> source);
		virtual ~HybridBinarizer();

		virtual Ref<BitMatrix> getBlackMatrix();
		Ref<Binarizer> createBinarizer(Ref<LuminanceSource> source);
  private:
    // We'll be using one-D arrays because C++ can't dynamically allocate 2D
    // arrays
    int* calculateBlackPoints(unsigned char* luminances,
                              int subWidth,
                              int subHeight,
                              int width,
                              int height);
    void calculateThresholdForBlock(unsigned char* luminances,
                                    int subWidth,
                                    int subHeight,
                                    int width,
                                    int height,
                                    int blackPoints[],
                                    Ref<BitMatrix> const& matrix);
    void threshold8x8Block(unsigned char* luminances,
                           int xoffset,
                           int yoffset,
                           int threshold,
                           int stride,
                           Ref<BitMatrix> const& matrix);
	};

}

#endif

// file: zxing/common/reedsolomon/GF256.h

#ifndef __GF256_H__
// #define __GF256_H__

/*
 *  GF256.h
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

// #include <memory>
// #include <vector>
// #include <zxing/common/Counted.h>

namespace zxing {
class GF256Poly;

class GF256 {
  /**
   * <p>This class contains utility methods for performing mathematical
   * operations over the Galois Field GF(256). Operations use a given
   * primitive polynomial in calculations.</p>
   *
   * <p>Throughout this package, elements of GF(256) are represented as an
   * <code>int</code> for convenience and speed (but at the cost of memory).
   * Only the bottom 8 bits are really used.</p>
   *
   * @author srowen@google.com (Sean Owen)
   * @author christian.brunschen@gmail.com (Christian Brunschen)
   */
private:
  std::vector<int> exp_;
  std::vector<int> log_;
  Ref<GF256Poly> zero_;
  Ref<GF256Poly> one_;

  GF256(int primitive);

public:
  Ref<GF256Poly> getZero();
  Ref<GF256Poly> getOne();
  Ref<GF256Poly> buildMonomial(int degree, int coefficient);
  static int addOrSubtract(int a, int b);
  int exp(int a);
  int log(int a);
  int inverse(int a);
  int multiply(int a, int b);

  static GF256 QR_CODE_FIELD;
  static GF256 DATA_MATRIX_FIELD;

  friend std::ostream& operator<<(std::ostream& out, const GF256& field);
};
}

#endif // __GF256_H__

// file: zxing/common/reedsolomon/GF256Poly.h

#ifndef __GF256_POLY_H__
// #define __GF256_POLY_H__

/*
 *  GF256Poly.h
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

// #include <memory>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>

namespace zxing {
class GF256;

class GF256Poly : public Counted {
private:
  GF256 &field;
  ArrayRef<int> coefficients;
  void fixCoefficients();
public:
  GF256Poly(GF256 &field, ArrayRef<int> c);
  ~GF256Poly();

  int getDegree();
  bool isZero();
  int getCoefficient(int degree);
  int evaluateAt(int a);
  Ref<GF256Poly> addOrSubtract(Ref<GF256Poly> other);
  Ref<GF256Poly> multiply(Ref<GF256Poly> other);
  Ref<GF256Poly> multiply(int scalar);
  Ref<GF256Poly> multiplyByMonomial(int degree, int coefficient);
  const char *description() const;
  friend std::ostream& operator<<(std::ostream& out, const GF256Poly& poly);

};
}

#endif // __GF256_POLY_H__

// file: zxing/common/reedsolomon/ReedSolomonDecoder.h

#ifndef __REED_SOLOMON_DECODER_H__
// #define __REED_SOLOMON_DECODER_H__

/*
 *  ReedSolomonDecoder.h
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

// #include <memory>
// #include <vector>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>

namespace zxing {
class GF256;
class GF256Poly;

class ReedSolomonDecoder {
private:
  GF256 &field;
public:
  ReedSolomonDecoder(GF256 &fld);
  ~ReedSolomonDecoder();
  void decode(ArrayRef<int> received, int twoS);
private:
  std::vector<Ref<GF256Poly> > runEuclideanAlgorithm(Ref<GF256Poly> a, Ref<GF256Poly> b, int R);
  ArrayRef<int> findErrorLocations(Ref<GF256Poly> errorLocator);
  ArrayRef<int> findErrorMagnitudes(Ref<GF256Poly> errorEvaluator, ArrayRef<int> errorLocations, bool dataMatrix);
};
}

#endif // __REED_SOLOMON_DECODER_H__

// file: zxing/common/reedsolomon/ReedSolomonException.h

#ifndef __REED_SOLOMON_EXCEPTION_H__
// #define __REED_SOLOMON_EXCEPTION_H__

/*
 *  ReedSolomonException.h
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

// #include <zxing/Exception.h>

namespace zxing {
class ReedSolomonException : public Exception {
public:
  ReedSolomonException(const char *msg) throw();
  ~ReedSolomonException() throw();
};
}

#endif // __REED_SOLOMON_EXCEPTION_H__

// file: zxing/BarcodeFormat.h

#ifndef __BARCODE_FORMAT_H__
// #define __BARCODE_FORMAT_H__

/*
 *  BarcodeFormat.h
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

namespace zxing {

	typedef enum BarcodeFormat {
		BarcodeFormat_None = 0,
		BarcodeFormat_QR_CODE,
		BarcodeFormat_DATA_MATRIX,
		BarcodeFormat_UPC_E,
		BarcodeFormat_UPC_A,
		BarcodeFormat_EAN_8,
		BarcodeFormat_EAN_13,
		BarcodeFormat_CODE_128,
		BarcodeFormat_CODE_39,
		BarcodeFormat_ITF
	} BarcodeFormat;

	/* if you update the enum, please update the name in BarcodeFormat.cpp */
	extern const char *barcodeFormatNames[];
}

#endif // __BARCODE_FORMAT_H__

// file: zxing/BinaryBitmap.h

#ifndef __BINARYBITMAP_H__
// #define __BINARYBITMAP_H__

/*
 *  BinaryBitmap.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Binarizer.h>

namespace zxing {

	class BinaryBitmap : public Counted {
	private:
		Ref<Binarizer> binarizer_;
		int cached_y_;

	public:
		BinaryBitmap(Ref<Binarizer> binarizer);
		virtual ~BinaryBitmap();

		Ref<BitArray> getBlackRow(int y, Ref<BitArray> row);
		Ref<BitMatrix> getBlackMatrix();

		Ref<LuminanceSource> getLuminanceSource() const;

		int getWidth() const;
		int getHeight() const;

		bool isRotateSupported() const;
		Ref<BinaryBitmap> rotateCounterClockwise();

		bool isCropSupported() const;
		Ref<BinaryBitmap> crop(int left, int top, int width, int height);

	};

}

#endif /* BINARYBITMAP_H_ */

// file: zxing/ResultPointCallback.h

#ifndef __RESULT_POINT_CALLBACK_H__
// #define __RESULT_POINT_CALLBACK_H__

/*
 *  ResultPointCallback.h
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

// #include <zxing/common/Counted.h>

namespace zxing {

class ResultPoint;

class ResultPointCallback : public Counted {
protected:
  ResultPointCallback() {}
public:
  virtual void foundPossibleResultPoint(ResultPoint const& point) = 0;
  virtual ~ResultPointCallback();
};

}

#endif // __RESULT_POINT_CALLBACK_H__

// file: zxing/DecodeHints.h

#ifndef __DECODEHINTS_H_
#define __DECODEHINTS_H_
/*
 *  DecodeHintType.h
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

// #include <zxing/BarcodeFormat.h>
// #include <zxing/ResultPointCallback.h>

namespace zxing {

typedef unsigned int DecodeHintType;

class DecodeHints {

 private:

  DecodeHintType hints;

  Ref<ResultPointCallback> callback;

 public:

  static const DecodeHintType BARCODEFORMAT_QR_CODE_HINT = 1 << BarcodeFormat_QR_CODE;
  static const DecodeHintType BARCODEFORMAT_DATA_MATRIX_HINT = 1 << BarcodeFormat_DATA_MATRIX;
  static const DecodeHintType BARCODEFORMAT_UPC_E_HINT = 1 << BarcodeFormat_UPC_E;
  static const DecodeHintType BARCODEFORMAT_UPC_A_HINT = 1 << BarcodeFormat_UPC_A;
  static const DecodeHintType BARCODEFORMAT_EAN_8_HINT = 1 << BarcodeFormat_EAN_8;
  static const DecodeHintType BARCODEFORMAT_EAN_13_HINT = 1 << BarcodeFormat_EAN_13;
  static const DecodeHintType BARCODEFORMAT_CODE_128_HINT = 1 << BarcodeFormat_CODE_128;
  static const DecodeHintType BARCODEFORMAT_CODE_39_HINT = 1 << BarcodeFormat_CODE_39;
  static const DecodeHintType BARCODEFORMAT_ITF_HINT = 1 << BarcodeFormat_ITF;
  static const DecodeHintType CHARACTER_SET = 1 << 30;
  static const DecodeHintType TRYHARDER_HINT = 1 << 31;

  static const DecodeHints PRODUCT_HINT;
  static const DecodeHints ONED_HINT;
  static const DecodeHints DEFAULT_HINT;

  DecodeHints();
  DecodeHints(DecodeHintType init);

  void addFormat(BarcodeFormat toadd);
  bool containsFormat(BarcodeFormat tocheck) const;
  void setTryHarder(bool toset);
  bool getTryHarder() const;

  void setResultPointCallback(Ref<ResultPointCallback> const&);
  Ref<ResultPointCallback> getResultPointCallback() const;

};

}

#endif

// file: zxing/Result.h

#ifndef __RESULT_H__
// #define __RESULT_H__

/*
 *  Result.h
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

// #include <string>
// #include <vector>
// #include <zxing/common/Array.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Str.h>
// #include <zxing/ResultPoint.h>
// #include <zxing/BarcodeFormat.h>

namespace zxing {

class Result : public Counted {
private:
  Ref<String> text_;
  ArrayRef<unsigned char> rawBytes_;
  std::vector<Ref<ResultPoint> > resultPoints_;
  BarcodeFormat format_;

public:
  Result(Ref<String> text, ArrayRef<unsigned char> rawBytes, std::vector<Ref<ResultPoint> > resultPoints,
         BarcodeFormat format);
  ~Result();
  Ref<String> getText();
  ArrayRef<unsigned char> getRawBytes();
  const std::vector<Ref<ResultPoint> >& getResultPoints() const;
  std::vector<Ref<ResultPoint> >& getResultPoints();
  BarcodeFormat getBarcodeFormat() const;

  friend std::ostream& operator<<(std::ostream &out, Result& result);
};

}
#endif // __RESULT_H__

// file: zxing/Reader.h

#ifndef __READER_H__
// #define __READER_H__

/*
 *  Reader.h
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
// #include <zxing/Result.h>
// #include <zxing/DecodeHints.h>

namespace zxing {

 class Reader : public Counted {
  protected:
   Reader() {}
  public:
   virtual Ref<Result> decode(Ref<BinaryBitmap> image);
   virtual Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints) = 0;
   virtual ~Reader();
};

}

#endif // __READER_H__

// file: zxing/MultiFormatReader.h

#ifndef __MULTI_FORMAT_READER_H__
// #define __MULTI_FORMAT_READER_H__

/*
 *  MultiFormatBarcodeReader.h
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


// #include <zxing/Reader.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Result.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
  class MultiFormatReader : public Reader {

  private:
    Ref<Result> decodeInternal(Ref<BinaryBitmap> image);

    std::vector<Ref<Reader> > readers_;
    DecodeHints hints_;

  public:
    MultiFormatReader();

    Ref<Result> decode(Ref<BinaryBitmap> image);
    Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);
    Ref<Result> decodeWithState(Ref<BinaryBitmap> image);
    void setHints(DecodeHints hints);
    ~MultiFormatReader();
  };
}

#endif

// file: zxing/ReaderException.h

#ifndef __READER_EXCEPTION_H__
// #define __READER_EXCEPTION_H__

/*
 *  ReaderException.h
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

// #include <zxing/Exception.h>

namespace zxing {

class ReaderException : public Exception {
public:
  ReaderException();
  ReaderException(const char *msg);
  ~ReaderException() throw();
};

}
#endif // __READER_EXCEPTION_H__

// file: zxing/datamatrix/decoder/Decoder.h

#ifndef __DECODER_DM_H__
// #define __DECODER_DM_H__

/*
 *  Decoder.h
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

// #include <zxing/common/reedsolomon/ReedSolomonDecoder.h>
// #include <zxing/common/reedsolomon/GF256.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/common/DecoderResult.h>
// #include <zxing/common/BitMatrix.h>


namespace zxing {
namespace datamatrix {

class Decoder {
private:
  ReedSolomonDecoder rsDecoder_;

  void correctErrors(ArrayRef<unsigned char> bytes, int numDataCodewords);

public:
  Decoder();

  Ref<DecoderResult> decode(Ref<BitMatrix> bits);
};

}
}

#endif // __DECODER_DM_H__

// file: zxing/datamatrix/DataMatrixReader.h

#ifndef __DATA_MATRIX_READER_H__
// #define __DATA_MATRIX_READER_H__

/*
 *  DataMatrixReader.h
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

// #include <zxing/Reader.h>
// #include <zxing/DecodeHints.h>
// #include <zxing/datamatrix/decoder/Decoder.h>

namespace zxing {
namespace datamatrix {

class DataMatrixReader : public Reader {
private:
  Decoder decoder_;

public:
  DataMatrixReader();
  virtual Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);
  virtual ~DataMatrixReader();

};

}
}

#endif // __DATA_MATRIX_READER_H__

// file: zxing/datamatrix/Version.h

#ifndef __VERSION_H__
// #define __VERSION_H__

/*
 *  Version.h
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
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <vector>

namespace zxing {
namespace datamatrix {

class ECB {
private:
  int count_;
  int dataCodewords_;
public:
  ECB(int count, int dataCodewords);
  int getCount();
  int getDataCodewords();
};

class ECBlocks {
private:
  int ecCodewords_;
  std::vector<ECB*> ecBlocks_;
public:
  ECBlocks(int ecCodewords, ECB *ecBlocks);
  ECBlocks(int ecCodewords, ECB *ecBlocks1, ECB *ecBlocks2);
  int getECCodewords();
  std::vector<ECB*>& getECBlocks();
  ~ECBlocks();
};

class Version : public Counted {
private:
  int versionNumber_;
  int symbolSizeRows_;
  int symbolSizeColumns_;
  int dataRegionSizeRows_;
  int dataRegionSizeColumns_;
  ECBlocks* ecBlocks_;
  int totalCodewords_;
  Version(int versionNumber, int symbolSizeRows, int symbolSizeColumns, int dataRegionSizeRows,
		  int dataRegionSizeColumns, ECBlocks *ecBlocks);

public:
  static std::vector<Ref<Version> > VERSIONS;

  ~Version();
  int getVersionNumber();
  int getSymbolSizeRows();
  int getSymbolSizeColumns();
  int getDataRegionSizeRows();
  int getDataRegionSizeColumns();
  int getTotalCodewords();
  ECBlocks* getECBlocks();
  static int  buildVersions();
  Ref<Version> getVersionForDimensions(int numRows, int numColumns);

private:
  Version(const Version&);
  Version & operator=(const Version&);
};
}
}

#endif // __VERSION_H__

// file: zxing/datamatrix/decoder/BitMatrixParser.h

#ifndef __BIT_MATRIX_PARSER_DM_H__
// #define __BIT_MATRIX_PARSER_DM_H__

/*
 *  BitMatrixParser.h
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
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/datamatrix/Version.h>

namespace zxing {
namespace datamatrix {

class BitMatrixParser : public Counted {
private:
  Ref<BitMatrix> bitMatrix_;
  Ref<Version> parsedVersion_;
  Ref<BitMatrix> readBitMatrix_;

  int copyBit(size_t x, size_t y, int versionBits);

public:
  BitMatrixParser(Ref<BitMatrix> bitMatrix);
  Ref<Version> readVersion(Ref<BitMatrix> bitMatrix);
  ArrayRef<unsigned char> readCodewords();
  bool readModule(int row, int column, int numRows, int numColumns);

private:
  int readUtah(int row, int column, int numRows, int numColumns);
  int readCorner1(int numRows, int numColumns);
  int readCorner2(int numRows, int numColumns);
  int readCorner3(int numRows, int numColumns);
  int readCorner4(int numRows, int numColumns);
  Ref<BitMatrix> extractDataRegion(Ref<BitMatrix> bitMatrix);
};

}
}

#endif // __BIT_MATRIX_PARSER_DM_H__

// file: zxing/datamatrix/decoder/DataBlock.h

#ifndef __DATA_BLOCK_DM_H__
// #define __DATA_BLOCK_DM_H__

/*
 *  DataBlock.h
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

// #include <vector>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/datamatrix/Version.h>

namespace zxing {
namespace datamatrix {

class DataBlock : public Counted {
private:
  int numDataCodewords_;
  ArrayRef<unsigned char> codewords_;

  DataBlock(int numDataCodewords, ArrayRef<unsigned char> codewords);

public:
  static std::vector<Ref<DataBlock> > getDataBlocks(ArrayRef<unsigned char> rawCodewords, Version *version);

  int getNumDataCodewords();
  ArrayRef<unsigned char> getCodewords();
};

}
}

#endif // __DATA_BLOCK_DM_H__

// file: zxing/datamatrix/decoder/DecodedBitStreamParser.h

#ifndef __DECODED_BIT_STREAM_PARSER_DM_H__
// #define __DECODED_BIT_STREAM_PARSER_DM_H__

/*
 *  DecodedBitStreamParser.h
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

// #include <string>
// #include <sstream>
// #include <zxing/common/Array.h>
// #include <zxing/common/BitSource.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/DecoderResult.h>


namespace zxing {
namespace datamatrix {

class DecodedBitStreamParser {
private:
  static const int PAD_ENCODE = 0;  // Not really an encoding
  static const int ASCII_ENCODE = 1;
  static const int C40_ENCODE = 2;
  static const int TEXT_ENCODE = 3;
  static const int ANSIX12_ENCODE = 4;
  static const int EDIFACT_ENCODE = 5;
  static const int BASE256_ENCODE = 6;

  /**
   * See ISO 16022:2006, Annex C Table C.1
   * The C40 Basic Character Set (*'s used for placeholders for the shift values)
   */
  static const char C40_BASIC_SET_CHARS[];

  static const char C40_SHIFT2_SET_CHARS[];
  /**
   * See ISO 16022:2006, Annex C Table C.2
   * The Text Basic Character Set (*'s used for placeholders for the shift values)
   */
  static const char TEXT_BASIC_SET_CHARS[];

  static const char TEXT_SHIFT3_SET_CHARS[];
  /**
   * See ISO 16022:2006, 5.2.3 and Annex C, Table C.2
   */
  int decodeAsciiSegment(Ref<BitSource> bits, std::ostringstream &result, std::ostringstream &resultTrailer);
  /**
   * See ISO 16022:2006, 5.2.5 and Annex C, Table C.1
   */
  void decodeC40Segment(Ref<BitSource> bits, std::ostringstream &result);
  /**
   * See ISO 16022:2006, 5.2.6 and Annex C, Table C.2
   */
  void decodeTextSegment(Ref<BitSource> bits, std::ostringstream &result);
  /**
   * See ISO 16022:2006, 5.2.7
   */
  void decodeAnsiX12Segment(Ref<BitSource> bits, std::ostringstream &result);
  /**
   * See ISO 16022:2006, 5.2.8 and Annex C Table C.3
   */
  void decodeEdifactSegment(Ref<BitSource> bits, std::ostringstream &result);
  /**
   * See ISO 16022:2006, 5.2.9 and Annex B, B.2
   */
  void decodeBase256Segment(Ref<BitSource> bits, std::ostringstream &result, std::vector<unsigned char> byteSegments);

  void parseTwoBytes(int firstByte, int secondByte, int*& result);
  /**
   * See ISO 16022:2006, Annex B, B.2
   */
  unsigned char unrandomize255State(int randomizedBase256Codeword,
                                          int base256CodewordPosition) {
    int pseudoRandomNumber = ((149 * base256CodewordPosition) % 255) + 1;
    int tempVariable = randomizedBase256Codeword - pseudoRandomNumber;
    return (unsigned char) (tempVariable >= 0 ? tempVariable : (tempVariable + 256));
  };
  void append(std::ostream &ost, const unsigned char *bufIn, size_t nIn, const char *src);

public:
  DecodedBitStreamParser() { };
  Ref<DecoderResult> decode(ArrayRef<unsigned char> bytes);
};

}
}

#endif // __DECODED_BIT_STREAM_PARSER_DM_H__

// file: zxing/datamatrix/detector/CornerPoint.h

#ifndef __CORNER_FINDER_H__
// #define __CORNER_FINDER_H__

/*
 *  CornerPoint.h
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
// #include <cmath>

namespace zxing {
	namespace datamatrix {

		class CornerPoint : public ResultPoint {
		private:
			int counter_;

		public:
			CornerPoint(float posX, float posY);
			int getCount() const;
			void incrementCount();
			bool equals(Ref<CornerPoint> other) const;
		};
	}
}

#endif // __CORNER_FINDER_H__

// file: zxing/datamatrix/detector/MonochromeRectangleDetector.h

#ifndef __MONOCHROMERECTANGLEDETECTOR_H__
// #define __MONOCHROMERECTANGLEDETECTOR_H__

/*
 *  MonochromeRectangleDetector.h
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

// #include <vector>
// #include <zxing/ReaderException.h>
// #include <zxing/ResultPoint.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <zxing/datamatrix/detector/CornerPoint.h>

namespace zxing {
namespace datamatrix {

struct TwoInts: public Counted {
	int start;
	int end;
};

class MonochromeRectangleDetector : public Counted {
private:
  static const int MAX_MODULES = 32;
  Ref<BitMatrix> image_;

public:
  MonochromeRectangleDetector(Ref<BitMatrix> image) : image_(image) {  };

  std::vector<Ref<CornerPoint> > detect();

private:
  Ref<CornerPoint> findCornerFromCenter(int centerX, int deltaX, int left, int right,
      int centerY, int deltaY, int top, int bottom, int maxWhiteRun);

  Ref<TwoInts> blackWhiteRange(int fixedDimension, int maxWhiteRun, int minDim, int maxDim,
      bool horizontal);

  int max(int a, float b) { return (float) a > b ? a : (int) b;};
};
}
}

#endif // __MONOCHROMERECTANGLEDETECTOR_H__

// file: zxing/datamatrix/detector/Detector.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __DETECTOR_H__
// #define __DETECTOR_H__

/*
 *  Detector.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/DetectorResult.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/PerspectiveTransform.h>
// #include <zxing/common/detector/WhiteRectangleDetector.h>

namespace zxing {
namespace datamatrix {

class ResultPointsAndTransitions: public Counted {
  private:
    Ref<ResultPoint> to_;
    Ref<ResultPoint> from_;
    int transitions_;

  public:
    ResultPointsAndTransitions();
    ResultPointsAndTransitions(Ref<ResultPoint> from, Ref<ResultPoint> to, int transitions);
    Ref<ResultPoint> getFrom();
    Ref<ResultPoint> getTo();
    int getTransitions();
};

class Detector: public Counted {
  private:
    Ref<BitMatrix> image_;

  protected:
    Ref<BitMatrix> sampleGrid(Ref<BitMatrix> image, int dimensionX, int dimensionY,
        Ref<PerspectiveTransform> transform);

    void insertionSort(std::vector<Ref<ResultPointsAndTransitions> >& vector);

    Ref<ResultPoint> correctTopRightRectangular(Ref<ResultPoint> bottomLeft,
        Ref<ResultPoint> bottomRight, Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight,
        int dimensionTop, int dimensionRight);
    Ref<ResultPoint> correctTopRight(Ref<ResultPoint> bottomLeft, Ref<ResultPoint> bottomRight,
        Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, int dimension);
    bool isValid(Ref<ResultPoint> p);
    int distance(Ref<ResultPoint> a, Ref<ResultPoint> b);
    Ref<ResultPointsAndTransitions> transitionsBetween(Ref<ResultPoint> from, Ref<ResultPoint> to);
    int min(int a, int b) {
      return a > b ? b : a;
    }
    /**
     * Ends up being a bit faster than round(). This merely rounds its
     * argument to the nearest int, where x.5 rounds up.
     */
    int round(float d) {
      return (int) (d + 0.5f);
    }

  public:
    Ref<BitMatrix> getImage();
    Detector(Ref<BitMatrix> image);

    virtual Ref<PerspectiveTransform> createTransform(Ref<ResultPoint> topLeft,
        Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft, Ref<ResultPoint> bottomRight,
        int dimensionX, int dimensionY);

    Ref<DetectorResult> detect();

  private:
    int compare(Ref<ResultPointsAndTransitions> a, Ref<ResultPointsAndTransitions> b);
};

}
}

#endif // __DETECTOR_H__

// file: zxing/oned/OneDReader.h

#ifndef __ONED_READER_H__
// #define __ONED_READER_H__

/*
 *  OneDReader.h
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

// #include <zxing/Reader.h>

namespace zxing {
	namespace oned {
		class OneDReader : public Reader {
		private:
			static const int INTEGER_MATH_SHIFT = 8;

			Ref<Result> doDecode(Ref<BinaryBitmap> image, DecodeHints hints);
		public:
			static const int PATTERN_MATCH_RESULT_SCALE_FACTOR = 1 << INTEGER_MATH_SHIFT;

			OneDReader();
			virtual Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);

			// Implementations must not throw any exceptions. If a barcode is not found on this row,
			// a empty ref should be returned e.g. return Ref<Result>();
			virtual Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row) = 0;

			static unsigned int patternMatchVariance(int counters[], int countersSize,
			    const int pattern[], int maxIndividualVariance);
			static bool recordPattern(Ref<BitArray> row, int start, int counters[], int countersCount);
			virtual ~OneDReader();
		};
	}
}

#endif

// file: zxing/oned/Code128Reader.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __CODE_128_READER_H__
// #define __CODE_128_READER_H__
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

// #include <zxing/oned/OneDReader.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Result.h>

namespace zxing {
	namespace oned {
		class Code128Reader : public OneDReader {

		private:
      enum {MAX_AVG_VARIANCE = (unsigned int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 250/1000)};
      enum {MAX_INDIVIDUAL_VARIANCE = (int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 700/1000)};
			static const int CODE_SHIFT = 98;

			static const int CODE_CODE_C = 99;
			static const int CODE_CODE_B = 100;
			static const int CODE_CODE_A = 101;

			static const int CODE_FNC_1 = 102;
			static const int CODE_FNC_2 = 97;
			static const int CODE_FNC_3 = 96;
			static const int CODE_FNC_4_A = 101;
			static const int CODE_FNC_4_B = 100;

			static const int CODE_START_A = 103;
			static const int CODE_START_B = 104;
			static const int CODE_START_C = 105;
			static const int CODE_STOP = 106;

			static int* findStartPattern(Ref<BitArray> row);
			static int decodeCode(Ref<BitArray> row, int counters[], int countersCount, int rowOffset);

			void append(char* s, char c);
		public:
			Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);
			Code128Reader();
			~Code128Reader();
		};
	}
}

#endif

// file: zxing/oned/Code39Reader.h

#ifndef __CODE_39_READER_H__
// #define __CODE_39_READER_H__
/*
 *  Code39Reader.h
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

// #include <zxing/oned/OneDReader.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Result.h>

namespace zxing {
	namespace oned {

		/**
		 * <p>Decodes Code 39 barcodes. This does not support "Full ASCII Code 39" yet.</p>
		 * Ported form Java (author Sean Owen)
		 * @author Lukasz Warchol
		 */
		class Code39Reader : public OneDReader {

		private:
			std::string alphabet_string;

			bool usingCheckDigit;
			bool extendedMode;

			static int* findAsteriskPattern(Ref<BitArray> row);														//throws ReaderException
			static int toNarrowWidePattern(int counters[], int countersLen);
			static char patternToChar(int pattern);																	//throws ReaderException
			static Ref<String> decodeExtended(std::string encoded);													//throws ReaderException

			void append(char* s, char c);
		public:
			Code39Reader();
			Code39Reader(bool usingCheckDigit_);
			Code39Reader(bool usingCheckDigit_, bool extendedMode_);

			Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);
    };
	}
}

#endif

// file: zxing/oned/UPCEANReader.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __UPC_EAN_READER_H__
// #define __UPC_EAN_READER_H__

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

// #include <zxing/oned/OneDReader.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Result.h>

typedef enum UPC_EAN_PATTERNS {
	UPC_EAN_PATTERNS_L_PATTERNS = 0,
	UPC_EAN_PATTERNS_L_AND_G_PATTERNS
} UPC_EAN_PATTERNS;

namespace zxing {
	namespace oned {
		class UPCEANReader : public OneDReader {

		private:
      enum {MAX_AVG_VARIANCE = (unsigned int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 420/1000)};
      enum {MAX_INDIVIDUAL_VARIANCE = (int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 700/1000)};

			static bool findStartGuardPattern(Ref<BitArray> row, int* rangeStart, int* rangeEnd);

			virtual bool decodeEnd(Ref<BitArray> row, int endStart, int* endGuardBegin, int* endGuardEnd);

			static bool checkStandardUPCEANChecksum(std::string s);
		protected:
			static bool findGuardPattern(Ref<BitArray> row, int rowOffset, bool whiteFirst,
			    const int pattern[], int patternLen, int* start, int* end);

			virtual int getMIDDLE_PATTERN_LEN();
			virtual const int* getMIDDLE_PATTERN();

		public:
			UPCEANReader();

      // Returns < 0 on failure, >= 0 on success.
			virtual int decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
			    std::string& resultString) = 0;

			Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);

			// TODO(dswitkin): Should this be virtual so that UPCAReader can override it?
			Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row, int startGuardBegin,
          int startGuardEnd);

      // Returns < 0 on failure, >= 0 on success.
			static int decodeDigit(Ref<BitArray> row, int counters[], int countersLen, int rowOffset,
			    UPC_EAN_PATTERNS patternType);

			virtual bool checkChecksum(std::string s);

			virtual BarcodeFormat getBarcodeFormat() = 0;
			virtual ~UPCEANReader();
		};
	}
}

#endif

// file: zxing/oned/EAN13Reader.h

#ifndef __EAN_13_READER_H__
// #define __EAN_13_READER_H__

/*
 *  EAN13Reader.h
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

// #include <zxing/oned/UPCEANReader.h>
// #include <zxing/Result.h>

namespace zxing {
  namespace oned {
    class EAN13Reader : public UPCEANReader {

    private:
      static bool determineFirstDigit(std::string& resultString, int lgPatternFound);

    public:
      EAN13Reader();

      int decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
          std::string& resultString);

      BarcodeFormat getBarcodeFormat();
    };
  }
}

#endif

// file: zxing/oned/EAN8Reader.h

#ifndef __EAN_8_READER_H__
// #define __EAN_8_READER_H__

/*
 *  EAN8Reader.h
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

// #include <zxing/oned/UPCEANReader.h>
// #include <zxing/Result.h>

namespace zxing {
  namespace oned {
    class EAN8Reader : public UPCEANReader {

    public:
      EAN8Reader();

      int decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
          std::string& resultString);

      BarcodeFormat getBarcodeFormat();
    };
  }
}

#endif

// file: zxing/oned/ITFReader.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __ITF_READER_H__
// #define __ITF_READER_H__

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

// #include <zxing/oned/OneDReader.h>
// #include <zxing/common/BitArray.h>
// #include <zxing/Result.h>

namespace zxing {
	namespace oned {
		class ITFReader : public OneDReader {

		private:
      enum {MAX_AVG_VARIANCE = (unsigned int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 420/1000)};
			enum {MAX_INDIVIDUAL_VARIANCE = (int) (PATTERN_MATCH_RESULT_SCALE_FACTOR * 800/1000)};
			// Stores the actual narrow line width of the image being decoded.
			int narrowLineWidth;

			int* decodeStart(Ref<BitArray> row);																		//throws ReaderException
			int* decodeEnd(Ref<BitArray> row);																				//throws ReaderException
			static void decodeMiddle(Ref<BitArray> row, int payloadStart, int payloadEnd, std::string& resultString);	//throws ReaderException
			void validateQuietZone(Ref<BitArray> row, int startPattern);												//throws ReaderException
			static int skipWhiteSpace(Ref<BitArray> row);																//throws ReaderException

			static int* findGuardPattern(Ref<BitArray> row, int rowOffset, const int pattern[], int patternLen);		//throws ReaderException
			static int decodeDigit(int counters[], int countersLen);													//throws ReaderException

			void append(char* s, char c);
		public:
			Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);									///throws ReaderException
			ITFReader();
			~ITFReader();
		};
	}
}

#endif

// file: zxing/oned/MultiFormatOneDReader.h

#ifndef __MULTI_FORMAT_ONED_READER_H__
// #define __MULTI_FORMAT_ONED_READER_H__
/*
 *  MultiFormatOneDReader.h
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

// #include <zxing/oned/OneDReader.h>

namespace zxing {
  namespace oned {
    class MultiFormatOneDReader : public OneDReader {

    private:
      std::vector<Ref<OneDReader> > readers;
    public:
      MultiFormatOneDReader(DecodeHints hints);

      Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);
    };
  }
}

#endif

// file: zxing/oned/MultiFormatUPCEANReader.h

#ifndef __MULTI_FORMAT_UPC_EAN_READER_H__
// #define __MULTI_FORMAT_UPC_EAN_READER_H__
/*
 *  MultiFormatUPCEANReader.h
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

// #include <zxing/oned/OneDReader.h>

namespace zxing {
  namespace oned {
    class MultiFormatUPCEANReader : public OneDReader {

    private:
      std::vector<Ref<OneDReader> > readers;
    public:
      MultiFormatUPCEANReader(DecodeHints hints);

      Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);
    };
  }
}

#endif

// file: zxing/oned/OneDResultPoint.h

#ifndef __ONED_RESULT_POINT_H__
// #define __ONED_RESULT_POINT_H__
/*
 *  OneDResultPoint.h
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
// #include <zxing/ResultPoint.h>
// #include <cmath>

namespace zxing {
	namespace oned {

		class OneDResultPoint : public ResultPoint {

		public:
			OneDResultPoint(float posX, float posY);
		};
	}
}

#endif

// file: zxing/oned/UPCAReader.h

#ifndef __UPCA_READER_H__
// #define __UPCA_READER_H__
/*
 *  UPCAReader.h
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

// #include <zxing/oned/EAN13Reader.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
  namespace oned {
    class UPCAReader : public UPCEANReader {

    private:
      EAN13Reader ean13Reader;
      static Ref<Result> maybeReturnResult(Ref<Result> result);

    public:
      UPCAReader();

      int decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
          std::string& resultString);

      Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row);
      Ref<Result> decodeRow(int rowNumber, Ref<BitArray> row, int startGuardBegin,
          int startGuardEnd);
      Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);

      BarcodeFormat getBarcodeFormat();
    };
  }
}

#endif

// file: zxing/oned/UPCEReader.h

#ifndef __UPC_E_READER_H__
// #define __UPC_E_READER_H__

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

// #include <zxing/oned/UPCEANReader.h>
// #include <zxing/Result.h>

namespace zxing {
  namespace oned {
    class UPCEReader : public UPCEANReader {

    private:
      static bool determineNumSysAndCheckDigit(std::string& resultString, int lgPatternFound);
    protected:
      bool decodeEnd(Ref<BitArray> row, int endStart, int* endGuardBegin, int* endGuardEnd);
      bool checkChecksum(std::string s);
    public:
      UPCEReader();

      int decodeMiddle(Ref<BitArray> row, int startGuardBegin, int startGuardEnd,
          std::string& resultString);
      static std::string convertUPCEtoUPCA(std::string upce);

      BarcodeFormat getBarcodeFormat();
    };
  }
}

#endif

// file: zxing/qrcode/ErrorCorrectionLevel.h

#ifndef __ERROR_CORRECTION_LEVEL_H__
// #define __ERROR_CORRECTION_LEVEL_H__

/*
 *  ErrorCorrectionLevel.h
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

// #include <zxing/ReaderException.h>

namespace zxing {
namespace qrcode {

class ErrorCorrectionLevel {
private:
  int ordinal_;
  int bits_;
  std::string name_;
  ErrorCorrectionLevel(int inOrdinal, int bits, char const* name);
  static ErrorCorrectionLevel *FOR_BITS[];
  static int N_LEVELS;
public:
  static ErrorCorrectionLevel L;
  static ErrorCorrectionLevel M;
  static ErrorCorrectionLevel Q;
  static ErrorCorrectionLevel H;

  int ordinal() const;
  int bits() const;
  std::string const& name() const;
  operator std::string const& () const;

  static ErrorCorrectionLevel& forBits(int bits);
};
}
}

#endif // __ERROR_CORRECTION_LEVEL_H__

// file: zxing/qrcode/FormatInformation.h

#ifndef __FORMAT_INFORMATION_H__
// #define __FORMAT_INFORMATION_H__

/*
 *  FormatInformation.h
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

// #include <zxing/qrcode/ErrorCorrectionLevel.h>
// #include <zxing/common/Counted.h>
// #include <iostream>

namespace zxing {
namespace qrcode {

class FormatInformation : public Counted {
private:
  static int FORMAT_INFO_MASK_QR;
  static int FORMAT_INFO_DECODE_LOOKUP[][2];
  static int N_FORMAT_INFO_DECODE_LOOKUPS;
  static int BITS_SET_IN_HALF_BYTE[];

  ErrorCorrectionLevel &errorCorrectionLevel_;
  unsigned char dataMask_;

  FormatInformation(int formatInfo);

public:
  static int numBitsDiffering(unsigned int a, unsigned int b);
  static Ref<FormatInformation> decodeFormatInformation(int maskedFormatInfo1, int maskedFormatInfo2);
  static Ref<FormatInformation> doDecodeFormatInformation(int maskedFormatInfo1, int maskedFormatInfo2);
  ErrorCorrectionLevel &getErrorCorrectionLevel();
  unsigned char getDataMask();
  friend bool operator==(const FormatInformation &a, const FormatInformation &b);
  friend std::ostream& operator<<(std::ostream& out, const FormatInformation& fi);
};
}
}

#endif // __FORMAT_INFORMATION_H__

// file: zxing/qrcode/decoder/Decoder.h

#ifndef __DECODER_H__
// #define __DECODER_H__

/*
 *  Decoder.h
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

// #include <zxing/common/reedsolomon/ReedSolomonDecoder.h>
// #include <zxing/common/reedsolomon/GF256.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/common/DecoderResult.h>
// #include <zxing/common/BitMatrix.h>

namespace zxing {
namespace qrcode {

class Decoder {
private:
  ReedSolomonDecoder rsDecoder_;

  void correctErrors(ArrayRef<unsigned char> bytes, int numDataCodewords);

public:
  Decoder();
  Ref<DecoderResult> decode(Ref<BitMatrix> bits);
};

}
}

#endif // __DECODER_H__

// file: zxing/qrcode/QRCodeReader.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __QR_CODE_READER_H__
// #define __QR_CODE_READER_H__

/*
 *  QRCodeReader.h
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

// #include <zxing/Reader.h>
// #include <zxing/qrcode/decoder/Decoder.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
	namespace qrcode {

		class QRCodeReader : public Reader {
		private:
			Decoder decoder_;

    protected:
      Decoder& getDecoder();

		public:
			QRCodeReader();
			virtual Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);
			virtual ~QRCodeReader();

		};
	}
}

#endif // __QR_CODE_READER_H__

// file: zxing/qrcode/Version.h

#ifndef __VERSION_H__
// #define __VERSION_H__

/*
 *  Version.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/qrcode/ErrorCorrectionLevel.h>
// #include <zxing/ReaderException.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <vector>

namespace zxing {
namespace qrcode {

class ECB {
private:
  int count_;
  int dataCodewords_;
public:
  ECB(int count, int dataCodewords);
  int getCount();
  int getDataCodewords();
};

class ECBlocks {
private:
  int ecCodewords_;
  std::vector<ECB*> ecBlocks_;
public:
  ECBlocks(int ecCodewords, ECB *ecBlocks);
  ECBlocks(int ecCodewords, ECB *ecBlocks1, ECB *ecBlocks2);
  int getECCodewords();
  std::vector<ECB*>& getECBlocks();
  ~ECBlocks();
};

class Version : public Counted {

private:
  int versionNumber_;
  std::vector<int> &alignmentPatternCenters_;
  std::vector<ECBlocks*> ecBlocks_;
  int totalCodewords_;
  Version(int versionNumber, std::vector<int> *alignmentPatternCenters, ECBlocks *ecBlocks1, ECBlocks *ecBlocks2,
          ECBlocks *ecBlocks3, ECBlocks *ecBlocks4);

public:
  static unsigned int VERSION_DECODE_INFO[];
  static int N_VERSION_DECODE_INFOS;
  static std::vector<Ref<Version> > VERSIONS;

  ~Version();
  int getVersionNumber();
  std::vector<int> &getAlignmentPatternCenters();
  int getTotalCodewords();
  int getDimensionForVersion();
  ECBlocks &getECBlocksForLevel(ErrorCorrectionLevel &ecLevel);
  static Version *getProvisionalVersionForDimension(int dimension);
  static Version *getVersionForNumber(int versionNumber);
  static Version *decodeVersionInformation(unsigned int versionBits);
  Ref<BitMatrix> buildFunctionPattern();
  static int buildVersions();
};
}
}

#endif // __VERSION_H__

// file: zxing/qrcode/decoder/BitMatrixParser.h

#ifndef __BIT_MATRIX_PARSER_H__
// #define __BIT_MATRIX_PARSER_H__

/*
 *  BitMatrixParser.h
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

// #include <zxing/ReaderException.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/qrcode/Version.h>
// #include <zxing/qrcode/FormatInformation.h>

namespace zxing {
namespace qrcode {

class BitMatrixParser : public Counted {
private:
  Ref<BitMatrix> bitMatrix_;
  Version *parsedVersion_;
  Ref<FormatInformation> parsedFormatInfo_;

  int copyBit(size_t x, size_t y, int versionBits);

public:
  BitMatrixParser(Ref<BitMatrix> bitMatrix);
  Ref<FormatInformation> readFormatInformation();
  Version *readVersion();
  ArrayRef<unsigned char> readCodewords();

private:
  BitMatrixParser(const BitMatrixParser&);
  BitMatrixParser& operator =(const BitMatrixParser&);

};

}
}

#endif // __BIT_MATRIX_PARSER_H__

// file: zxing/qrcode/decoder/DataBlock.h

#ifndef __DATA_BLOCK_H__
// #define __DATA_BLOCK_H__

/*
 *  DataBlock.h
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

// #include <vector>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/qrcode/Version.h>
// #include <zxing/qrcode/ErrorCorrectionLevel.h>

namespace zxing {
namespace qrcode {

class DataBlock : public Counted {
private:
  int numDataCodewords_;
  ArrayRef<unsigned char> codewords_;

  DataBlock(int numDataCodewords, ArrayRef<unsigned char> codewords);

public:
  static std::vector<Ref<DataBlock> >
  getDataBlocks(ArrayRef<unsigned char> rawCodewords, Version *version, ErrorCorrectionLevel &ecLevel);

  int getNumDataCodewords();
  ArrayRef<unsigned char> getCodewords();
};

}
}

#endif // __DATA_BLOCK_H__

// file: zxing/qrcode/decoder/DataMask.h

#ifndef __DATA_MASK_H__
// #define __DATA_MASK_H__

/*
 *  DataMask.h
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

// #include <zxing/common/Array.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/BitMatrix.h>

// #include <vector>

namespace zxing {
namespace qrcode {

class DataMask : public Counted {
private:
  static std::vector<Ref<DataMask> > DATA_MASKS;

protected:

public:
  static int buildDataMasks();
  DataMask();
  virtual ~DataMask();
  void unmaskBitMatrix(BitMatrix& matrix, size_t dimension);
  virtual bool isMasked(size_t x, size_t y) = 0;
  static DataMask& forReference(int reference);
};

}
}

#endif // __DATA_MASK_H__

// file: zxing/qrcode/decoder/Mode.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __MODE_H__
// #define __MODE_H__

/*
 *  Mode.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/qrcode/Version.h>

namespace zxing {
namespace qrcode {

class Mode {
private:
  int characterCountBitsForVersions0To9_;
  int characterCountBitsForVersions10To26_;
  int characterCountBitsForVersions27AndHigher_;
  int bits_;
  std::string name_;

  Mode(int cbv0_9, int cbv10_26, int cbv27, int bits, char const* name);

public:
  static Mode TERMINATOR;
  static Mode NUMERIC;
  static Mode ALPHANUMERIC;
  static Mode STRUCTURED_APPEND;
  static Mode BYTE;
  static Mode ECI;
  static Mode KANJI;
  static Mode FNC1_FIRST_POSITION;
  static Mode FNC1_SECOND_POSITION;
  static Mode HANZI;

  static Mode& forBits(int bits);
  int getCharacterCountBits(Version *version);
};
}
}

#endif // __MODE_H__

// file: zxing/common/ECI.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __ECI__
#define __ECI__

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

namespace zxing {
  namespace common {
    class ECI;
  }
}
class zxing::common::ECI {
private:
  const int value;

protected:
  ECI(int value);

public:
  int getValue() const;

  static ECI* getECIByValue(int value);
};

#endif

// file: zxing/common/CharacterSetECI.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __CHARACTERSET_ECI__
#define __CHARACTERSET_ECI__

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

// #include <map>
// #include <zxing/common/ECI.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
  namespace common {
    class CharacterSetECI;
  }
}

class zxing::common::CharacterSetECI : public ECI {
private:
  static std::map<int, CharacterSetECI*> VALUE_TO_ECI;
  static std::map<std::string, CharacterSetECI*> NAME_TO_ECI;
  static const bool inited;
  static bool init_tables();

  char const* const encodingName;

  CharacterSetECI(int value, char const* encodingName);

  static void addCharacterSet(int value, char const* encodingName);
  static void addCharacterSet(int value, char const* const* encodingNames);

public:
  char const* getEncodingName();

  static CharacterSetECI* getCharacterSetECIByValue(int value);
  static CharacterSetECI* getCharacterSetECIByName(std::string const& name);
};

#endif

// file: zxing/qrcode/decoder/DecodedBitStreamParser.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __DECODED_BIT_STREAM_PARSER_H__
// #define __DECODED_BIT_STREAM_PARSER_H__

/*
 *  DecodedBitStreamParser.h
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

// #include <string>
// #include <sstream>
// #include <map>
// #include <zxing/qrcode/decoder/Mode.h>
// #include <zxing/common/BitSource.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <zxing/common/DecoderResult.h>
// #include <zxing/common/CharacterSetECI.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
namespace qrcode {

class DecodedBitStreamParser {
public:
  typedef std::map<DecodeHintType, std::string> Hashtable;

private:
  static char const ALPHANUMERIC_CHARS[];
  static char toAlphaNumericChar(size_t value);

  static void decodeHanziSegment(Ref<BitSource> bits, std::string &result, int count);
  static void decodeKanjiSegment(Ref<BitSource> bits, std::string &result, int count);
  static void decodeByteSegment(Ref<BitSource> bits, std::string &result, int count);
  static void decodeByteSegment(Ref<BitSource> bits_,
                                std::string& result,
                                int count,
                                zxing::common::CharacterSetECI* currentCharacterSetECI,
                                ArrayRef< ArrayRef<unsigned char> >& byteSegments,
                                Hashtable const& hints);
  static void decodeAlphanumericSegment(Ref<BitSource> bits, std::string &result, int count, bool fc1InEffect);
  static void decodeNumericSegment(Ref<BitSource> bits, std::string &result, int count);

  static void append(std::string &ost, const unsigned char *bufIn, size_t nIn, const char *src);
  static void append(std::string &ost, std::string const& in, const char *src);

public:
  static Ref<DecoderResult> decode(ArrayRef<unsigned char> bytes,
                                   Version *version,
                                   ErrorCorrectionLevel const& ecLevel,
                                   Hashtable const& hints);
};

}
}

#endif // __DECODED_BIT_STREAM_PARSER_H__

// file: zxing/qrcode/detector/AlignmentPattern.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __ALIGNMENT_PATTERN_H__
// #define __ALIGNMENT_PATTERN_H__

/*
 *  AlignmentPattern.h
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

// #include <zxing/ResultPoint.h>
// #include <cmath>

namespace zxing {
	namespace qrcode {

		class AlignmentPattern : public ResultPoint {
		private:
			float estimatedModuleSize_;

		public:
			AlignmentPattern(float posX, float posY, float estimatedModuleSize);
			bool aboutEquals(float moduleSize, float i, float j) const;
      Ref<AlignmentPattern> combineEstimate(float i, float j,
                                            float newModuleSize) const;
		};

	}
}

#endif // __ALIGNMENT_PATTERN_H__

// file: zxing/qrcode/detector/AlignmentPatternFinder.h

#ifndef __ALIGNMENT_PATTERN_FINDER_H__
// #define __ALIGNMENT_PATTERN_FINDER_H__

/*
 *  AlignmentPatternFinder.h
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

// #include "AlignmentPattern.h"
// #include <zxing/common/Counted.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/ResultPointCallback.h>
// #include <vector>

namespace zxing {
namespace qrcode {

class AlignmentPatternFinder : public Counted {
private:
  static int CENTER_QUORUM;
  static int MIN_SKIP;
  static int MAX_MODULES;

  Ref<BitMatrix> image_;
  std::vector<AlignmentPattern *> *possibleCenters_;
  size_t startX_;
  size_t startY_;
  size_t width_;
  size_t height_;
  float moduleSize_;

  static float centerFromEnd(std::vector<int> &stateCount, int end);
  bool foundPatternCross(std::vector<int> &stateCount);

  float crossCheckVertical(size_t startI, size_t centerJ, int maxCount, int originalStateCountTotal);

  Ref<AlignmentPattern> handlePossibleCenter(std::vector<int> &stateCount, size_t i, size_t j);

public:
  AlignmentPatternFinder(Ref<BitMatrix> image, size_t startX, size_t startY, size_t width, size_t height,
                         float moduleSize, Ref<ResultPointCallback>const& callback);
  ~AlignmentPatternFinder();
  Ref<AlignmentPattern> find();

private:
  AlignmentPatternFinder(const AlignmentPatternFinder&);
  AlignmentPatternFinder& operator =(const AlignmentPatternFinder&);

  Ref<ResultPointCallback> callback_;
};
}
}

#endif // __ALIGNMENT_PATTERN_FINDER_H__

// file: zxing/qrcode/detector/FinderPattern.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-
#ifndef __FINDER_PATTERN_H__
// #define __FINDER_PATTERN_H__

/*
 *  FinderPattern.h
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

// #include <zxing/ResultPoint.h>
// #include <cmath>

namespace zxing {
	namespace qrcode {

		class FinderPattern : public ResultPoint {
		private:
			float estimatedModuleSize_;
			int count_;

		public:
			FinderPattern(float posX, float posY, float estimatedModuleSize);
			FinderPattern(float posX, float posY, float estimatedModuleSize, int count);
			int getCount() const;
			float getEstimatedModuleSize() const;
			void incrementCount();
			bool aboutEquals(float moduleSize, float i, float j) const;
			Ref<FinderPattern> combineEstimate(float i, float j, float newModuleSize) const;
		};
	}
}

#endif // __FINDER_PATTERN_H__

// file: zxing/qrcode/detector/FinderPatternInfo.h

#ifndef __FINDER_PATTERN_INFO_H__
// #define __FINDER_PATTERN_INFO_H__

/*
 *  FinderPatternInfo.h
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

// #include <zxing/qrcode/detector/FinderPattern.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/Array.h>
// #include <vector>

namespace zxing {
namespace qrcode {

class FinderPatternInfo : public Counted {
private:
  Ref<FinderPattern> bottomLeft_;
  Ref<FinderPattern> topLeft_;
  Ref<FinderPattern> topRight_;

public:
  FinderPatternInfo(std::vector<Ref<FinderPattern> > patternCenters);

  Ref<FinderPattern> getBottomLeft();
  Ref<FinderPattern> getTopLeft();
  Ref<FinderPattern> getTopRight();
};
}
}

#endif // __FINDER_PATTERN_INFO_H__

// file: zxing/qrcode/detector/Detector.h

#ifndef __DETECTOR_H__
// #define __DETECTOR_H__

/*
 *  Detector.h
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

// #include <zxing/common/Counted.h>
// #include <zxing/common/DetectorResult.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/qrcode/detector/AlignmentPattern.h>
// #include <zxing/common/PerspectiveTransform.h>
// #include <zxing/ResultPointCallback.h>
// #include <zxing/qrcode/detector/FinderPatternInfo.h>

namespace zxing {

class DecodeHints;

namespace qrcode {

class Detector : public Counted {
private:
  Ref<BitMatrix> image_;
  Ref<ResultPointCallback> callback_;

protected:
  Ref<BitMatrix> getImage();

  static Ref<BitMatrix> sampleGrid(Ref<BitMatrix> image, int dimension, Ref<PerspectiveTransform>);
  static int computeDimension(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft,
                              float moduleSize);
  float calculateModuleSize(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref<ResultPoint> bottomLeft);
  float calculateModuleSizeOneWay(Ref<ResultPoint> pattern, Ref<ResultPoint> otherPattern);
  float sizeOfBlackWhiteBlackRunBothWays(int fromX, int fromY, int toX, int toY);
  float sizeOfBlackWhiteBlackRun(int fromX, int fromY, int toX, int toY);
  Ref<AlignmentPattern> findAlignmentInRegion(float overallEstModuleSize, int estAlignmentX, int estAlignmentY,
      float allowanceFactor);
  Ref<DetectorResult> processFinderPatternInfo(Ref<FinderPatternInfo> info);
public:

  virtual Ref<PerspectiveTransform> createTransform(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref <
      ResultPoint > bottomLeft, Ref<ResultPoint> alignmentPattern, int dimension);

  Detector(Ref<BitMatrix> image);
  Ref<DetectorResult> detect(DecodeHints const& hints);
};
}
}

#endif // __DETECTOR_H__

// file: zxing/qrcode/detector/FinderPatternFinder.h

#ifndef __FINDER_PATTERN_FINDER_H__
// #define __FINDER_PATTERN_FINDER_H__

/*
 *  FinderPatternFinder.h
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

// #include <zxing/qrcode/detector/FinderPattern.h>
// #include <zxing/qrcode/detector/FinderPatternInfo.h>
// #include <zxing/common/Counted.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/ResultPointCallback.h>
// #include <vector>

namespace zxing {

class DecodeHints;

namespace qrcode {

class FinderPatternFinder {
private:
  static int CENTER_QUORUM;

protected:
  static int MIN_SKIP;
  static int MAX_MODULES;

  Ref<BitMatrix> image_;
  std::vector<Ref<FinderPattern> > possibleCenters_;
  bool hasSkipped_;

  Ref<ResultPointCallback> callback_;

  /** stateCount must be int[5] */
  static float centerFromEnd(int* stateCount, int end);
  static bool foundPatternCross(int* stateCount);

  float crossCheckVertical(size_t startI, size_t centerJ, int maxCount, int originalStateCountTotal);
  float crossCheckHorizontal(size_t startJ, size_t centerI, int maxCount, int originalStateCountTotal);

  /** stateCount must be int[5] */
  bool handlePossibleCenter(int* stateCount, size_t i, size_t j);
  int findRowSkip();
  bool haveMultiplyConfirmedCenters();
  std::vector<Ref<FinderPattern> > selectBestPatterns();
  static std::vector<Ref<FinderPattern> > orderBestPatterns(std::vector<Ref<FinderPattern> > patterns);
public:
  static float distance(Ref<ResultPoint> p1, Ref<ResultPoint> p2);
  FinderPatternFinder(Ref<BitMatrix> image, Ref<ResultPointCallback>const&);
  Ref<FinderPatternInfo> find(DecodeHints const& hints);
};
}
}

#endif // __FINDER_PATTERN_FINDER_H__

// file: zxing/qrcode/detector/QREdgeDetector.h

#ifndef __QREDGEDETECTOR_H__
// #define __QREDGEDETECTOR_H__
/*
 *  QREdgeDetector.h
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



// #include <zxing/qrcode/detector/Detector.h>
// #include <zxing/common/Point.h>

namespace zxing {
namespace qrcode {

class QREdgeDetector : public Detector {
public:
  QREdgeDetector(Ref<BitMatrix> image);

  virtual Ref<PerspectiveTransform> createTransform(Ref<ResultPoint> topLeft, Ref<ResultPoint> topRight, Ref <
      ResultPoint > bottomLeft, Ref<ResultPoint> alignmentPattern, int dimension);

private:
  Point findCorner(const BitMatrix& image, Point topLeft, Point topRight, Point bottomLeft, int dimension);
  Line findPatternEdge(const BitMatrix& image, Point pattern, Point opposite, Point direction, bool invert);

  Point endOfReverseBlackWhiteBlackRun(const BitMatrix& image, Point from, Point to);

  Ref<PerspectiveTransform> get1CornerTransform(Point topLeft, Point topRight, Point bottomLeft, Point corner, int dimension);
};

}
}
#endif // QREDGEDETECTOR_H_

// file: zxing/FormatException.h

#ifndef __FORMAT_EXCEPTION_H__
// #define __FORMAT_EXCEPTION_H__

/*
 *  FormatException.h
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

// #include <zxing/ReaderException.h>

namespace zxing {

class FormatException : public ReaderException {
public:
  FormatException();
  FormatException(const char *msg);
  ~FormatException() throw();
};

}
#endif // __FORMAT_EXCEPTION_H__

// file: zxing/NotFoundException.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __NOT_FOUND_EXCEPTION_H__
// #define __NOT_FOUND_EXCEPTION_H__

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

// #include <zxing/ReaderException.h>

namespace zxing {

  class NotFoundException : public ReaderException {
  public:
    NotFoundException(const char *msg);
    ~NotFoundException() throw();
  };

}
#endif // __NOT_FOUND_EXCEPTION_H__

// file: zxing/common/StringUtils.h

// -*- mode:c++; tab-width:2; indent-tabs-mode:nil; c-basic-offset:2 -*-

#ifndef __STRING_UTILS__
#define __STRING_UTILS__

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

// #include <string>
// #include <map>
// #include <zxing/DecodeHints.h>

namespace zxing {
  namespace common {
    class StringUtils;
  }
}

class zxing::common::StringUtils {
private:
  static char const* const PLATFORM_DEFAULT_ENCODING;

  StringUtils() {}

public:
  static char const* const ASCII;
  static char const* const SHIFT_JIS;
  static char const* const GB2312;
  static char const* const EUC_JP;
  static char const* const UTF8;
  static char const* const ISO88591;
  static const bool ASSUME_SHIFT_JIS;

  typedef std::map<DecodeHintType, std::string> Hashtable;

  static std::string guessEncoding(unsigned char* bytes, int length, Hashtable const& hints);
};

#endif

// file: zxing/common/detector/MonochromeRectangleDetector.h

#ifndef __MONOCHROMERECTANGLEDETECTOR_H__
// #define __MONOCHROMERECTANGLEDETECTOR_H__

/*
 *  MonochromeRectangleDetector.h
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

// #include <vector>
// #include <zxing/NotFoundException.h>
// #include <zxing/ResultPoint.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <zxing/ResultPoint.h>


namespace zxing {

struct TwoInts: public Counted {
	int start;
	int end;
};

class MonochromeRectangleDetector : public Counted {
private:
  static const int MAX_MODULES = 32;
  Ref<BitMatrix> image_;

public:
  MonochromeRectangleDetector(Ref<BitMatrix> image) : image_(image) {  };

  std::vector<Ref<ResultPoint> > detect();

private:
  Ref<ResultPoint> findCornerFromCenter(int centerX, int deltaX, int left, int right,
      int centerY, int deltaY, int top, int bottom, int maxWhiteRun);

  Ref<TwoInts> blackWhiteRange(int fixedDimension, int maxWhiteRun, int minDim, int maxDim,
      bool horizontal);

  int max(int a, float b) { return (float) a > b ? a : (int) b;};
};
}

#endif // __MONOCHROMERECTANGLEDETECTOR_H__

// file: zxing/common/detector/WhiteRectangleDetector.h

#ifndef __WHITERECTANGLEDETECTOR_H__
// #define __WHITERECTANGLEDETECTOR_H__

/*
 *  WhiteRectangleDetector.h
 *
 *
 *  Created by Luiz Silva on 09/02/2010.
 *  Copyright 2010  authors All rights reserved.
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
// #include <zxing/ReaderException.h>
// #include <zxing/ResultPoint.h>
// #include <zxing/common/BitMatrix.h>
// #include <zxing/common/Counted.h>
// #include <zxing/ResultPoint.h>


namespace zxing {

class WhiteRectangleDetector : public Counted {
  private:
    static int INIT_SIZE;
    static int CORR;
    Ref<BitMatrix> image_;
    int width_;
    int height_;

  public:
    WhiteRectangleDetector(Ref<BitMatrix> image);
    std::vector<Ref<ResultPoint> > detect();

  private:
    int round(float a);
    Ref<ResultPoint> getBlackPointOnSegment(float aX, float aY, float bX, float bY);
    int distanceL2(float aX, float aY, float bX, float bY);
    std::vector<Ref<ResultPoint> > centerEdges(Ref<ResultPoint> y, Ref<ResultPoint> z,
                                    Ref<ResultPoint> x, Ref<ResultPoint> t);
    bool containsBlackPoint(int a, int b, int fixed, bool horizontal);
};
}

#endif

// file: zxing/datamatrix/detector/DetectorException.h

/*
 * DetectorException.h
 *
 *  Created on: Aug 26, 2011
 *      Author: luiz
 */

#ifndef DETECTOREXCEPTION_H_
#define DETECTOREXCEPTION_H_

// #include <zxing/Exception.h>

namespace zxing {
namespace datamatrix {

class DetectorException : public Exception {
  public:
    DetectorException(const char *msg);
    virtual ~DetectorException() throw();
};
} /* namespace nexxera */
} /* namespace zxing */
#endif /* DETECTOREXCEPTION_H_ */

// file: zxing/multi/ByQuadrantReader.h

#ifndef __BY_QUADRANT_READER_H__
// #define __BY_QUADRANT_READER_H__

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

// #include <zxing/Reader.h>
// #include <zxing/BinaryBitmap.h>
// #include <zxing/Result.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
namespace multi {
class ByQuadrantReader : public Reader {
  private:
    Reader& delegate_;

  public:
    ByQuadrantReader(Reader& delegate);
    virtual ~ByQuadrantReader();
    virtual Ref<Result> decode(Ref<BinaryBitmap> image);
    virtual Ref<Result> decode(Ref<BinaryBitmap> image, DecodeHints hints);
};
} // End zxing::multi namespace
} // End zxing namespace

#endif // __BY_QUADRANT_READER_H__

// file: zxing/multi/MultipleBarcodeReader.h

#ifndef __MULTIPLE_BARCODE_READER_H__
// #define __MULTIPLE_BARCODE_READER_H__

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

// #include <zxing/common/Counted.h>
// #include <zxing/Result.h>
// #include <zxing/BinaryBitmap.h>
// #include <zxing/DecodeHints.h>
// #include <vector>

namespace zxing {
namespace multi {
class MultipleBarcodeReader : public Counted {
  protected:
    MultipleBarcodeReader() {}
  public:
    virtual std::vector<Ref<Result> > decodeMultiple(Ref<BinaryBitmap> image);
    virtual std::vector<Ref<Result> > decodeMultiple(Ref<BinaryBitmap> image, DecodeHints hints) = 0;
    virtual ~MultipleBarcodeReader();
};
} // End zxing::multi namespace
} // End zxing namespace

#endif // __MULTIPLE_BARCODE_READER_H__

// file: zxing/multi/GenericMultipleBarcodeReader.h

#ifndef __GENERIC_MULTIPLE_BARCODE_READER_H__
// #define __GENERIC_MULTIPLE_BARCODE_READER_H__

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
// #include <zxing/Reader.h>

namespace zxing {
namespace multi {
class GenericMultipleBarcodeReader : public MultipleBarcodeReader {
  private:
    static Ref<Result> translateResultPoints(Ref<Result> result,
                                             int xOffset,
                                             int yOffset);
    void doDecodeMultiple(Ref<BinaryBitmap> image,
                          DecodeHints hints,
                          std::vector<Ref<Result> >& results,
                          int xOffset,
                          int yOffset);
    Reader& delegate_;
    static const int MIN_DIMENSION_TO_RECUR = 100;

  public:
    GenericMultipleBarcodeReader(Reader& delegate);
    virtual ~GenericMultipleBarcodeReader();
    virtual std::vector<Ref<Result> > decodeMultiple(Ref<BinaryBitmap> image,
                                                     DecodeHints hints);
};
} // End zxing::multi namespace
} // End zxing namespace

#endif // __GENERIC_MULTIPLE_BARCODE_READER_H__

// file: zxing/multi/qrcode/QRCodeMultiReader.h

#ifndef __QRCODE_MULTI_READER_H__
// #define __QRCODE_MULTI_READER_H__

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
// #include <zxing/qrcode/QRCodeReader.h>

namespace zxing {
namespace multi {
class QRCodeMultiReader: public zxing::qrcode::QRCodeReader, public MultipleBarcodeReader {
  public:
    QRCodeMultiReader();
    virtual ~QRCodeMultiReader();
    virtual std::vector<Ref<Result> > decodeMultiple(Ref<BinaryBitmap> image, DecodeHints hints);
};
} // End zxing::multi namespace
} // End zxing namespace

#endif // __QRCODE_MULTI_READER_H__

// file: zxing/multi/qrcode/detector/MultiDetector.h

#ifndef __MULTI_DETECTOR_H__
// #define __MULTI_DETECTOR_H__

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

// #include <zxing/qrcode/detector/Detector.h>
// #include <zxing/common/DetectorResult.h>
// #include <zxing/DecodeHints.h>

namespace zxing {
namespace multi {
class MultiDetector : public zxing::qrcode::Detector {
  public:
    MultiDetector(Ref<BitMatrix> image);
    virtual ~MultiDetector();
    virtual std::vector<Ref<DetectorResult> > detectMulti(DecodeHints hints);
};
} // End zxing::multi namespace
} // End zxing namespace

#endif // __MULTI_DETECTOR_H__

// file: zxing/multi/qrcode/detector/MultiFinderPatternFinder.h

#ifndef __MULTI_FINDER_PATTERN_FINDER_H__
// #define __MULTI_FINDER_PATTERN_FINDER_H__

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

// #include <zxing/qrcode/detector/FinderPattern.h>
// #include <zxing/qrcode/detector/FinderPatternFinder.h>
// #include <zxing/qrcode/detector/FinderPatternInfo.h>

namespace zxing {
namespace multi {
class MultiFinderPatternFinder : zxing::qrcode::FinderPatternFinder {
  private:
    std::vector<std::vector<Ref<zxing::qrcode::FinderPattern> > > selectBestPatterns();

    static const float MAX_MODULE_COUNT_PER_EDGE;
    static const float MIN_MODULE_COUNT_PER_EDGE;
    static const float DIFF_MODSIZE_CUTOFF_PERCENT;
    static const float DIFF_MODSIZE_CUTOFF;

  public:
    MultiFinderPatternFinder(Ref<BitMatrix> image, Ref<ResultPointCallback> resultPointCallback);
    virtual ~MultiFinderPatternFinder();
    virtual std::vector<Ref<zxing::qrcode::FinderPatternInfo> > findMulti(DecodeHints const& hints);


};
}
}

#endif // __MULTI_FINDER_PATTERN_FINDER_H__

